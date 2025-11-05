module.exports = function home(req, res) {
  res.status(200).json({ message: 'OK', data: { service: 'Llama.io API' } });
};
