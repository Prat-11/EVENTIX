// userService.js — all user profile logic lives here
import { db } from '../config/database.js';
import { deleteImage } from '../config/cloudinary.js';

// ── Get profile ───────────────────────────────────────────────────────────────
export const getUserProfile = async (userId) => {
  const result = await db.query(
    'SELECT id, name, email, avatar, phone, dob, location, bio, interests, notifications, is_admin, created_at FROM users WHERE id = $1',
    [userId]
  );
  if (!result.rows[0]) throw { status: 404, message: 'User not found' };
  return result.rows[0];
};

// ── Update profile ────────────────────────────────────────────────────────────
export const updateUserProfile = async (userId, requesterId, isAdmin, updates) => {
  // only the user themselves or an admin can update
  if (requesterId !== userId && !isAdmin) throw { status: 403, message: 'Forbidden' };

  const { name, phone, dob, location, bio, interests, notifications } = updates;

  // build dynamic SET clause — only update fields that were sent
  const fields = [];
  const values = [];
  let i = 1;

  if (name != null)          { fields.push(`name = $${i++}`);          values.push(name); }
  if (phone != null)         { fields.push(`phone = $${i++}`);         values.push(phone); }
  if (dob != null)           { fields.push(`dob = $${i++}`);           values.push(dob); }
  if (location != null)      { fields.push(`location = $${i++}`);      values.push(location); }
  if (bio != null)           { fields.push(`bio = $${i++}`);           values.push(bio); }
  if (interests != null)     { fields.push(`interests = $${i++}`);     values.push(JSON.stringify(interests)); }
  if (notifications != null) { fields.push(`notifications = $${i++}`); values.push(notifications); }

  if (fields.length === 0) return { message: 'Nothing to update' };

  values.push(userId); // last param is the WHERE clause
  await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${i}`, values);

  return { message: 'Profile updated successfully' };
};

// ── Upload avatar (called after Cloudinary upload) ────────────────────────────
export const updateAvatar = async (userId, avatarUrl, avatarPublicId) => {
  // get old avatar public_id so we can delete it from Cloudinary
  const old = await db.query('SELECT avatar_public_id FROM users WHERE id = $1', [userId]);
  const oldPublicId = old.rows[0]?.avatar_public_id;

  // save new avatar URL and public_id to DB
  await db.query(
    'UPDATE users SET avatar = $1, avatar_public_id = $2 WHERE id = $3',
    [avatarUrl, avatarPublicId, userId]
  );

  // delete old image from Cloudinary (don't block response)
  if (oldPublicId) deleteImage(oldPublicId);

  return { avatar: avatarUrl };
};

// ── Get user bookings ─────────────────────────────────────────────────────────
export const getUserBookings = async (userId, requesterId, isAdmin) => {
  if (requesterId !== userId && !isAdmin) throw { status: 403, message: 'Forbidden' };

  // JOIN enrollments with events to get full booking info
  const result = await db.query(
    `SELECT
       e.id,
       e.event_name   AS "eventName",
       e.organizer_name AS "organizerName",
       e.date,
       e.category,
       e.image,
       e.members_required AS "membersRequired",
       e.enrolled_members AS "enrolledMembers",
       en.seats,
       en.seat_count  AS "seatCount",
       en.enrolled_at AS "enrolledAt"
     FROM enrollments en
     JOIN events e ON e.id = en.event_id
     WHERE en.user_id = $1
     ORDER BY en.enrolled_at DESC`,
    [userId]
  );

  return result.rows;
};
