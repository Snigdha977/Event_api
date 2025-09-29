const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.json());

// In-memory data stores
let events = [];
let nudges = [];
let eventIdCounter = 1;
let nudgeIdCounter = 1;

// --- Event APIs ---

// Create Event
app.post('/api/v3/app/events', upload.single('image'), (req, res) => {
  const { name, tagline, schedule, description, moderator, category, sub_category, rigor_rank } = req.body;
  if (!name || !schedule) return res.status(400).json({ error: 'Name and schedule required' });

  const event = {
    id: eventIdCounter++,
    name,
    tagline,
    schedule: new Date(schedule).toISOString(),
    description,
    moderator,
    category,
    sub_category,
    rigor_rank: parseInt(rigor_rank) || 0,
    attendees: [],
    image: req.file ? req.file.filename : null,
  };
  events.push(event);
  res.status(201).json(event);
});

// Get Event by ID
app.get('/api/v3/app/events', (req, res) => {
  const { id, type, limit = 5, page = 1 } = req.query;

  if (id) {
    const event = events.find(e => e.id === parseInt(id));
    if (!event) return res.status(404).json({ error: 'Event not found' });
    return res.json(event);
  }

  if (type === 'latest') {
    // Sort by schedule descending and paginate
    const sorted = events.sort((a, b) => new Date(b.schedule) - new Date(a.schedule));
    const start = (page - 1) * limit;
    const paged = sorted.slice(start, start + parseInt(limit));
    return res.json(paged);
  }

  res.json(events);
});

// Update Event
app.put('/api/v3/app/events/:id', upload.single('image'), (req, res) => {
  const id = parseInt(req.params.id);
  const event = events.find(e => e.id === id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const { name, tagline, schedule, description, moderator, category, sub_category, rigor_rank } = req.body;

  if (name) event.name = name;
  if (tagline) event.tagline = tagline;
  if (schedule) event.schedule = new Date(schedule).toISOString();
  if (description) event.description = description;
  if (moderator) event.moderator = moderator;
  if (category) event.category = category;
  if (sub_category) event.sub_category = sub_category;
  if (rigor_rank) event.rigor_rank = parseInt(rigor_rank);
  if (req.file) event.image = req.file.filename;

  res.json(event);
});

// Delete Event
app.delete('/api/v3/app/events/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = events.findIndex(e => e.id === id);
  if (index === -1) return res.status(404).json({ error: 'Event not found' });

  events.splice(index, 1);
  res.json({ message: 'Event deleted' });
});

// Add attendee to event (invitation)
app.post('/api/v3/app/events/:id/attendees', (req, res) => {
  const id = parseInt(req.params.id);
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const event = events.find(e => e.id === id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  if (!event.attendees.includes(userId)) {
    event.attendees.push(userId);
  }
  res.json({ attendees: event.attendees });
});

// --- Nudge APIs ---

// Create Nudge
app.post('/api/v3/app/nudges', upload.single('cover_image'), (req, res) => {
  const { uid, event_id, title, send_time, description, icon, invitation_line } = req.body;
  if (!uid || !event_id || !title || !send_time) return res.status(400).json({ error: 'uid, event_id, title, send_time required' });

  const nudge = {
    id: nudgeIdCounter++,
    uid: parseInt(uid),
    event_id: parseInt(event_id),
    title,
    cover_image: req.file ? req.file.filename : null,
    send_time: new Date(send_time).toISOString(),
    description,
    icon,
    invitation_line,
  };
  nudges.push(nudge);
  res.status(201).json(nudge);
});

// Get Nudge by ID
app.get('/api/v3/app/nudges', (req, res) => {
  const { id, event_id, limit = 5, page = 1 } = req.query;

  if (id) {
    const nudge = nudges.find(n => n.id === parseInt(id));
    if (!nudge) return res.status(404).json({ error: 'Nudge not found' });
    return res.json(nudge);
  }

  if (event_id) {
    const filtered = nudges.filter(n => n.event_id === parseInt(event_id));
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + parseInt(limit));
    return res.json(paged);
  }

  res.json(nudges);
});

// Update Nudge
app.put('/api/v3/app/nudges/:id', upload.single('cover_image'), (req, res) => {
  const id = parseInt(req.params.id);
  const nudge = nudges.find(n => n.id === id);
  if (!nudge) return res.status(404).json({ error: 'Nudge not found' });

  const { uid, event_id, title, send_time, description, icon, invitation_line } = req.body;

  if (uid) nudge.uid = parseInt(uid);
  if (event_id) nudge.event_id = parseInt(event_id);
  if (title) nudge.title = title;
  if (send_time) nudge.send_time = new Date(send_time).toISOString();
  if (description) nudge.description = description;
  if (icon) nudge.icon = icon;
  if (invitation_line) nudge.invitation_line = invitation_line;
  if (req.file) nudge.cover_image = req.file.filename;

  res.json(nudge);
});

// Delete Nudge
app.delete('/api/v3/app/nudges/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = nudges.findIndex(n => n.id === id);
  if (index === -1) return res.status(404).json({ error: 'Nudge not found' });

  nudges.splice(index, 1);
  res.json({ message: 'Nudge deleted' });
});

// --- Start server ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Event Management API running on http://localhost:${PORT}`);
});