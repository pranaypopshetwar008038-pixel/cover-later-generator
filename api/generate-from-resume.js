export default async function handler(req, res) {
  res.status(200).json({
    success: true,
    coverLetter: "Resume upload API working ✔ (test mode)"
  });
}
