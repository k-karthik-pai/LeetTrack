import mongoose from 'mongoose';
import BaseUser from '../backend/models/User.js';
const { Schema, model } = mongoose;
const ref = { type: Schema.Types.ObjectId, ref: 'User' };
const statSchema = new Schema({
  total: { type: Number, default: 0 }, easy: { type: Number, default: 0 }, medium: { type: Number, default: 0 }, hard: { type: Number, default: 0 },
  rating: { type: Number, default: 0 }, globalRanking: { type: Number, default: 0 }, contests: { type: Number, default: 0 },
  calendar: { type: Map, of: Number, default: {} },
  contestHistory: [{ _id: false, title: String, date: String, rating: Number, ranking: Number }],
  recent: [{ _id: false, title: String, slug: String, timestamp: Number, language: String }],
  syncedAt: Date, syncError: String
}, { _id: false });
// Extend Rankboard's original User model instead of creating a parallel identity.
const userSchema = BaseUser.schema;
userSchema.path('password').required(false).select(false);
userSchema.add({
  name: { type: String, required: true }, email: { type: String, required: true, lowercase: true, unique: true },
  passwordHash: { type: String, select: false }, googleId: { type: String, select: false },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  college: { type: String, default: 'campus', index: true },
  // Legacy academic metadata remains readable, but new users receive no invented defaults.
  department: String, section: String, semester: Number,
  bio: { type: String, default: '' }, leetcode: String,
  verified: { type: Boolean, default: false }, demo: { type: Boolean, default: false },
  following: [ref], stats: { type: statSchema, default: () => ({}) },
  goal: { type: Number, default: 5 },
  visibility: { type: String, enum: ['college', 'groups', 'private'], default: 'college' },
  visibleGroups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
  authVersion: { type: Number, default: 0 }
});
userSchema.index({ college: 1, leetcode: 1 }, { unique: true, partialFilterExpression: { leetcode: { $type: 'string' } } });
mongoose.deleteModel('User');
export const User = model('User', userSchema);
const snapshotSchema = new Schema({
  user: { ...ref, required: true, index: true }, date: { type: String, required: true },
  handle: String, total: Number, easy: Number, medium: Number, hard: Number, rating: Number, rank: Number, percentile: Number
}, { timestamps: true });
snapshotSchema.index({ user: 1, date: 1 }, { unique: true });
export const Snapshot = model('Snapshot', snapshotSchema);
export const Group = model('Group', new Schema({
  name: String, description: String, college: { type: String, index: true }, owner: ref,
  members: [ref], inviteCode: { type: String, unique: true }, color: { type: String, default: 'mint' }
}, { timestamps: true }));
export const Challenge = model('Challenge', new Schema({
  title: String, description: String, college: { type: String, index: true }, creator: ref,
  group: { type: Schema.Types.ObjectId, ref: 'Group', default: null },
  metric: { type: String, enum: ['total', 'easy', 'medium', 'hard'], default: 'total' }, target: Number,
  startsAt: Date, endsAt: Date,
  participants: [{ _id: false, user: ref, baseline: Number, joinedAt: Date, finalValue: Number }]
}, { timestamps: true }));
const contestEntrySchema = new Schema({
  user: ref, joinedAt: Date, checkedAt: Date, checkError: String,
  // Every in-window submission seen on LeetCode, accumulated across checks because only the latest 20 are public.
  seen: [{ _id: false, slug: String, ts: Number, status: String, lang: String }],
  solutions: [{ _id: false, slug: String, lang: String, code: String, savedAt: Date }]
}, { _id: false });
export const Contest = model('Contest', new Schema({
  title: String, description: String, college: { type: String, index: true }, organiser: ref,
  group: { type: Schema.Types.ObjectId, ref: 'Group', default: null }, inviteCode: { type: String, unique: true },
  startsAt: Date, endsAt: { type: Date, index: true }, penalty: { type: Number, default: 5 },
  problems: [{ _id: false, slug: String, title: String, difficulty: String, premium: Boolean, points: Number }],
  participants: [contestEntrySchema], checkedAt: Date, finalized: { type: Boolean, default: false }
}, { timestamps: true }));
export const Activity = model('Activity', new Schema({
  college: { type: String, index: true }, user: ref, group: { type: Schema.Types.ObjectId, ref: 'Group', default: null },
  type: String, text: String
}, { timestamps: true }));
export const Department = model('Department', new Schema({
  college: String, code: String, name: String, sections: [String]
}, { timestamps: true }));
Department.schema.index({ college: 1, code: 1 }, { unique: true });
export const Roster = model('Roster', new Schema({
  college: String, name: String, email: String, department: String, section: String, semester: Number, leetcode: String
}, { timestamps: true }));
Roster.schema.index({ college: 1, email: 1 }, { unique: true });
