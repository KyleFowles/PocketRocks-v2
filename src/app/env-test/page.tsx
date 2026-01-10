export default function EnvTest() {
  return (
    <pre style={{ padding: 24 }}>
      {JSON.stringify(
        {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "FOUND" : "MISSING",
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? null,
        },
        null,
        2
      )}
    </pre>
  );
}
