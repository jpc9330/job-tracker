const express = require('express');
const app = express();
const db = require('./db');
const path = require('path');
const fs = require('fs');
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Home Route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Show Add Job Form (standalone page)
app.get('/add', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'add.html'));
});

// Handle Add Job (both /add form and inline form)
app.post('/add', (req, res) => {
  const { company, position, date_applied, status, notes } = req.body;

  const sql = `
    INSERT INTO jobs (company, position, date_applied, status, notes)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(sql, [company, position, date_applied, status, notes], function (err) {
    if (err) {
      console.error(err.message);
      res.send('Error adding job.');
    } else {
      res.redirect('/jobs');
    }
  });
});

// View All Jobs (with inline add form)
app.get('/jobs', (req, res) => {
  const sql = 'SELECT * FROM jobs';

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.send('Error fetching jobs.');
      return;
    }

    const rowsHtml = rows.map(job => `
      <tr>
        <td>${job.company}</td>
        <td>${job.position}</td>
        <td>${job.date_applied || ''}</td>
        <td>${job.status || ''}</td>
        <td>${job.notes || ''}</td>
        <td>
          <a href="/edit/${job.id}">Edit</a>
          <form action="/delete/${job.id}" method="POST" style="display:inline;">
            <button type="submit" onclick="return confirm('Delete this job?');">Delete</button>
          </form>
        </td>
      </tr>
    `).join('');

    const htmlPath = path.join(__dirname, 'views', 'jobs.html');
    fs.readFile(htmlPath, 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        res.send('Error loading jobs page.');
        return;
      }

      const finalHtml = data
        .replace('<div id="add-form-placeholder"></div>', `
          <form action="/add" method="POST" style="margin-bottom: 30px;">
            <h2>Add a New Job</h2>
            <label>Company:</label><br>
            <input type="text" name="company" required><br>

            <label>Position:</label><br>
            <input type="text" name="position" required><br>

            <label>Date Applied:</label><br>
            <input type="date" name="date_applied"><br>

            <label>Status:</label><br>
            <input type="text" name="status"><br>

            <label>Notes:</label><br>
            <textarea name="notes" rows="3"></textarea><br>

            <button type="submit">Add Job</button>
          </form>
        `)
        .replace('<tbody id="job-rows">', `<tbody id="job-rows">\n${rowsHtml}`);

      res.send(finalHtml);
    });
  });
});


// Show Edit Form
app.get('/edit/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'SELECT * FROM jobs WHERE id = ?';

  db.get(sql, [id], (err, job) => {
    if (err || !job) {
      return res.send('Job not found.');
    }

    const htmlPath = path.join(__dirname, 'views', 'edit.html');
    fs.readFile(htmlPath, 'utf8', (err, data) => {
      if (err) {
        return res.send('Error loading form.');
      }

      let filledHtml = data
        .replace('{{id}}', job.id)
        .replace('{{company}}', job.company)
        .replace('{{position}}', job.position)
        .replace('{{date_applied}}', job.date_applied || '')
        .replace('{{status}}', job.status || '')
        .replace('{{notes}}', job.notes || '');

      res.send(filledHtml);
    });
  });
});

// Handle Edit Submission
app.post('/update', (req, res) => {
  const { id, company, position, date_applied, status, notes } = req.body;

  const sql = `
    UPDATE jobs SET
      company = ?,
      position = ?,
      date_applied = ?,
      status = ?,
      notes = ?
    WHERE id = ?
  `;

  db.run(sql, [company, position, date_applied, status, notes, id], function (err) {
    if (err) {
      console.error(err.message);
      res.send('Error updating job.');
    } else {
      res.redirect('/jobs');
    }
  });
});

// Handle Delete
app.post('/delete/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'DELETE FROM jobs WHERE id = ?';

  db.run(sql, [id], function (err) {
    if (err) {
      console.error(err.message);
      res.send('Error deleting job.');
    } else {
      res.redirect('/jobs');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is listening at http://localhost:${PORT}`);
});
