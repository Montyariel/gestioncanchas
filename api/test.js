module.exports = (req, res) => {
  res.status(200).json({ ok: true, message: "Hello from test function!" });
};
