// Minimal HTTP client + fixture builders used by the isolation tests.
async function request(baseUrl, method, urlPath, { token, json, form } = {}) {
  const headers = {};
  const options = { method, headers };

  if (token) headers.Authorization = `Bearer ${token}`;

  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(json);
  } else if (form !== undefined) {
    options.body = form;
  }

  const response = await fetch(`${baseUrl}${urlPath}`, options);
  const text = await response.text();

  let data = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON responses (blobs, plain text) are returned as-is.
  }

  return { status: response.status, data };
}

async function registerUser(baseUrl, { name, email, password, role }) {
  return request(baseUrl, "POST", "/api/auth/register", {
    json: { name, email, password, role },
  });
}

async function loginUser(baseUrl, email, password) {
  const response = await request(baseUrl, "POST", "/api/auth/login", {
    json: { email, password },
  });

  if (response.status !== 200 || !response.data?.token) {
    throw new Error(`Login failed for ${email}: ${response.status} ${JSON.stringify(response.data)}`);
  }

  return { token: response.data.token, user: response.data.user };
}

// Builds a tiny text-based PDF with a correct xref table so PDF text extraction
// (and therefore POST /api/lessons/upload) works without any external fixtures.
function buildTestPdf(text) {
  const escape = (value) => String(value).replace(/([\\()])/g, "\\$1");
  const stream = `BT /F1 14 Tf 60 720 Td (${escape(text)}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [];

  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "latin1");
}

async function uploadLesson(baseUrl, token, { title, text, language = "en" }) {
  const form = new FormData();
  form.append(
    "pdf",
    new Blob([buildTestPdf(text)], { type: "application/pdf" }),
    `${title.replace(/[^\w.-]+/g, "_")}.pdf`
  );
  form.append("title", title);
  form.append("language", language);

  return request(baseUrl, "POST", "/api/lessons/upload", { token, form });
}

async function uploadVideo(baseUrl, token, {
  title,
  language = "en",
  filename = "lesson.mp4",
  mimeType = "video/mp4",
  features = ["summary"],
}) {
  const form = new FormData();
  form.append("video", new Blob(["test video bytes"], { type: mimeType }), filename);
  form.append("title", title);
  form.append("language", language);
  form.append("features", JSON.stringify(features));
  form.append("level", "beginner");
  form.append("needs", JSON.stringify([]));
  return request(baseUrl, "POST", "/api/videos/upload", { token, form });
}

async function getLessonSubtitle(baseUrl, token, lessonId, language) {
  const response = await fetch(`${baseUrl}/api/videos/subtitles/${lessonId}/${language}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return {
    status: response.status,
    contentType: response.headers.get("content-type"),
    text: await response.text(),
  };
}

module.exports = { request, registerUser, loginUser, uploadLesson, uploadVideo, getLessonSubtitle, buildTestPdf };
