import { db } from '../config/database.js';
import { deleteImage } from '../config/cloudinary.js';

export const getAllEvents = async () => {
  const today = new Date().toISOString().split('T')[0];

  const result = await db.query(
    `SELECT
       e.*,
       COALESCE(
         json_agg(
           json_build_object(
             'userId',    en.user_id,
             'userName',  en.user_name,
             'userEmail', en.user_email,
             'seats',     en.seats,
             'seatCount', en.seat_count,
             'enrolledAt',en.enrolled_at
           )
         ) FILTER (WHERE en.id IS NOT NULL),
         '[]'
       ) AS enrollments
     FROM events e
     LEFT JOIN enrollments en ON en.event_id = e.id
     WHERE e.date >= $1
     GROUP BY e.id
     ORDER BY e.date ASC, e.created_at DESC`,
    [today]
  );

  return result.rows.map(formatEvent);
};

export const createEvent = async (organizer, eventData, imageUrl, imagePublicId) => {
  const { eventName, date, membersRequired, description, category } = eventData;

  if (!eventName || !date || !membersRequired)
    throw { status: 400, message: 'eventName, date, and membersRequired are required' };

  const result = await db.query(
    `INSERT INTO events (organizer_id, organizer_name, event_name, date, description, category, image, image_public_id, members_required)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [organizer.id, organizer.name, eventName, date, description || '', category || 'general', imageUrl || null, imagePublicId || null, parseInt(membersRequired)]
  );

  return formatEvent(result.rows[0]);
};

export const getEventReservations = async (eventId) => {
  const result = await db.query(
    `SELECT * FROM reservations WHERE event_id = $1 AND expires_at > NOW()`,
    [eventId]
  );
  return result.rows;
};

export const reserveSeats = async (eventId, userId, userName, seats) => {
  if (!seats.length) throw { status: 400, message: 'No seats provided' };
  if (seats.length > 10) throw { status: 400, message: 'Maximum 10 seats per booking' };

  const evRes = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
  if (!evRes.rows[0]) throw { status: 404, message: 'Event not found' };

  const takenRes = await db.query(`SELECT seats FROM enrollments WHERE event_id = $1`, [eventId]);
  const takenSeats = new Set(takenRes.rows.flatMap(r => r.seats || []));
  const conflict = seats.find(s => takenSeats.has(s));
  if (conflict) throw { status: 400, message: `Seat ${conflict} is already taken` };

  const resRes = await db.query(
    `SELECT seats FROM reservations WHERE event_id = $1 AND expires_at > NOW() AND user_id != $2`,
    [eventId, userId]
  );
  const reservedByOthers = new Set(resRes.rows.flatMap(r => r.seats || []));
  const reservedConflict = seats.find(s => reservedByOthers.has(s));
  if (reservedConflict) throw { status: 400, message: `Seat ${reservedConflict} is being held by another user` };

  await db.query('DELETE FROM reservations WHERE event_id = $1 AND user_id = $2', [eventId, userId]);

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  const newRes = await db.query(
    `INSERT INTO reservations (event_id, user_id, user_name, seats, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [eventId, userId, userName, JSON.stringify(seats), expiresAt]
  );

  return { reservationId: newRes.rows[0].id, expiresAt: expiresAt.toISOString(), eventId, seats, userId: userId.toString() };
};

export const clearReservation = async (eventId, userId) => {
  const res = await db.query('SELECT seats FROM reservations WHERE event_id = $1 AND user_id = $2', [eventId, userId]);
  const seats = res.rows.flatMap(r => r.seats || []);
  await db.query('DELETE FROM reservations WHERE event_id = $1 AND user_id = $2', [eventId, userId]);
  return { seats, eventId };
};

export const enrollInEvent = async (eventId, userData, seats) => {
  const count = seats.length || 1;
  if (count > 10) throw { status: 400, message: 'Maximum 10 seats per booking' };

  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const evRes = await client.query('SELECT * FROM events WHERE id = $1 FOR UPDATE', [eventId]);
    const event = evRes.rows[0];
    if (!event) { await client.query('ROLLBACK'); throw { status: 404, message: 'Event not found' }; }

    const alreadyRes = await client.query('SELECT id FROM enrollments WHERE event_id = $1 AND user_id = $2', [eventId, userData.id]);
    if (alreadyRes.rows.length > 0) { await client.query('ROLLBACK'); throw { status: 400, message: 'Already enrolled in this event' }; }

    const spotsLeft = event.members_required - event.enrolled_members;
    if (spotsLeft < count) { await client.query('ROLLBACK'); throw { status: 400, message: `Only ${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} remaining` }; }

    if (seats.length > 0) {
      const takenRes = await client.query('SELECT seats FROM enrollments WHERE event_id = $1', [eventId]);
      const takenSeats = new Set(takenRes.rows.flatMap(r => r.seats || []));
      const conflict = seats.find(s => takenSeats.has(s));
      if (conflict) { await client.query('ROLLBACK'); throw { status: 400, message: `Seat ${conflict} already taken` }; }
    }

    await client.query(
      `INSERT INTO enrollments (event_id, user_id, user_name, user_email, seats, seat_count) VALUES ($1, $2, $3, $4, $5, $6)`,
      [eventId, userData.id, userData.name, userData.email, JSON.stringify(seats), count]
    );

    await client.query('UPDATE events SET enrolled_members = enrolled_members + $1 WHERE id = $2', [count, eventId]);
    await client.query('DELETE FROM reservations WHERE event_id = $1 AND user_id = $2', [eventId, userData.id]);

    await client.query('COMMIT');

    const updatedEv = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
    return { message: `${count} seat${count > 1 ? 's' : ''} booked successfully`, seats, event: formatEvent(updatedEv.rows[0]), eventId, userId: userData.id };

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const deleteEvent = async (eventId, userId, isAdmin) => {
  const res = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
  const event = res.rows[0];
  if (!event) throw { status: 404, message: 'Event not found' };
  if (event.organizer_id !== userId && !isAdmin) throw { status: 403, message: 'Forbidden' };
  if (event.image_public_id) deleteImage(event.image_public_id);
  await db.query('DELETE FROM events WHERE id = $1', [eventId]);
  return { eventId };
};

export const cleanupExpiredReservations = async () => {
  const expired = await db.query('SELECT event_id, seats FROM reservations WHERE expires_at <= NOW()');
  if (expired.rows.length === 0) return { count: 0, released: {} };

  const released = {};
  expired.rows.forEach(r => {
    const eid = r.event_id;
    if (!released[eid]) released[eid] = [];
    released[eid].push(...(r.seats || []));
  });

  await db.query('DELETE FROM reservations WHERE expires_at <= NOW()');
  return { count: expired.rows.length, released };
};

const formatEvent = (row) => {
  if (!row) return null;
  return {
    id:              row.id,
    organizerId:     row.organizer_id,
    organizerName:   row.organizer_name,
    eventName:       row.event_name,
    date:            row.date,
    description:     row.description,
    category:        row.category,
    image:           row.image,
    membersRequired: row.members_required,
    enrolledMembers: row.enrolled_members,
    enrollments:     row.enrollments || [],
    createdAt:       row.created_at,
    updatedAt:       row.updated_at
  };
};
