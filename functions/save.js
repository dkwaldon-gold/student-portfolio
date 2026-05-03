export async function onRequestPost(context) {
  const { request, env } = context;

  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  let body;
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: cors }); }

  if (!body.password || body.password !== env.EDIT_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
  }

  const { owner, repo, path, content, sha, branch } = body;
  if (!owner || !repo || !path || !content || !sha) {
    return new Response(JSON.stringify({ error: 'Missing fields', got: { owner, repo, path, hasSha: !!sha, branch } }), { status: 400, headers: cors });
  }

  const ghBody = { message: 'Profile updated via edit mode', content, sha };
  if (branch) ghBody.branch = branch;

  const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'EduProfile-Pages-Function',
    },
    body: JSON.stringify(ghBody),
  });

  const ghJson = await ghRes.json();
  if (!ghRes.ok) {
    return new Response(JSON.stringify({
      error: ghJson.message || 'GitHub push failed',
      ghStatus: ghRes.status,
      branch: branch || '(none)',
    }), { status: 500, headers: cors });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }});
}
