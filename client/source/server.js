const express = require('express');
const path = require('path');
const app = express();

app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' https://apis.google.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' " +
    `${process.env.REACT_APP_PRODUCTION_URL} ` +
    `wss://${process.env.REACT_APP_FIREBASE_PROJECT_ID}.firebaseapp.com ` +
    "https://firestore.googleapis.com https://www.googleapis.com; " +
    `frame-src 'self' https://${process.env.REACT_APP_FIREBASE_PROJECT_ID}.firebaseapp.com`
  );
  next();
});

app.use(express.static(path.join(__dirname, '../client/source/build'), {
  setHeaders: (res, path) => {
    console.log(`Serving static file: ${path}`);
  }
}));

app.get('/*', function (req, res) {
  console.log(`Serving index.html for path: ${req.path}`);
  res.sendFile(path.join(__dirname, '../client/source/build', 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});