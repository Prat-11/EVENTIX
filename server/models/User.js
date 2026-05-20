
import { DataTypes } from 'sequelize'; // datatypes for fields
import { sequelize } from '../config/database.js'; // db connection
import bcryptjs from 'bcryptjs'; // for hashing passwords

// define user model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID, // unique id
    defaultValue: DataTypes.UUIDV4, // auto uuid
    primaryKey: true // primary key
  },
  name: {
    type: DataTypes.STRING, // name
    allowNull: false, // required
    trim: true // remove spaces
  },
  email: {
    type: DataTypes.STRING, // email
    allowNull: false, // required
    unique: true, // must be unique
    lowercase: true, // always lowercase
    trim: true, // remove spaces
    validate: {
      isEmail: true // must be email
    }
  },
  password: {
    type: DataTypes.STRING, // hashed password
    allowNull: false // required
  },
  firebaseUid: {
    type: DataTypes.STRING, // firebase id
    allowNull: true // optional
  },
  avatar: {
    type: DataTypes.STRING, // avatar url
    allowNull: true // optional
  },
  avatarPublicId: {
    type: DataTypes.STRING, // cloudinary id
    allowNull: true // optional
  },
  phone: {
    type: DataTypes.STRING, // phone number
    allowNull: true // optional
  },
  dob: {
    type: DataTypes.DATE, // date of birth
    allowNull: true // optional
  },
  location: {
    type: DataTypes.STRING, // location
    allowNull: true // optional
  },
  bio: {
    type: DataTypes.TEXT, // bio
    allowNull: true // optional
  },
  interests: {
    type: DataTypes.JSON, // array of interests
    defaultValue: [] // default empty
  },
  notifications: {
    type: DataTypes.ENUM('all', 'important', 'none'), // notif type
    defaultValue: 'all' // default all
  },
  blocked: {
    type: DataTypes.BOOLEAN, // blocked or not
    defaultValue: false // default not blocked
  },
  isAdmin: {
    type: DataTypes.BOOLEAN, // admin or not
    defaultValue: false // default not admin
  },
  blockedAt: {
    type: DataTypes.DATE, // when blocked
    allowNull: true // optional
  },
  unblockedAt: {
    type: DataTypes.DATE, // when unblocked
    allowNull: true // optional
  }
}, {
  timestamps: true, // auto add createdAt/updatedAt
  underscored: false, // camelCase fields
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcryptjs.genSalt(10); // make salt
        user.password = await bcryptjs.hash(user.password, salt); // hash pass
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcryptjs.genSalt(10); // make salt
        user.password = await bcryptjs.hash(user.password, salt); // hash pass
      }
    }
  }
});

// compare password method
User.prototype.comparePassword = async function(password) {
  return await bcryptjs.compare(password, this.password); // true if match
};

export default User; // export model
