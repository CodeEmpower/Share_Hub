import { Webhook } from "svix";
import { headers } from "next/headers";
import { createOrUpdateUser, deleteUser } from "@lib/actions/user";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  throw new Error(
    "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: "Error occurred -- no svix headers" });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return res.status(400).json({ error: "Error occurred" });
  }

  // Handle the event
  const eventType = evt?.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, first_name, last_name, image_url, email_addresses, username } = evt?.data;

    try {
      await createOrUpdateUser(id, first_name, last_name, image_url, email_addresses, username);
      return res.status(200).json({ message: "User is created or updated" });
    } catch (err) {
      console.error("Error creating or updating user:", err);
      return res.status(500).json({ error: "Error occurred" });
    }
  }

  if (eventType === "user.deleted") {
    try {
      const { id } = evt?.data;
      await deleteUser(id);
      return res.status(200).json({ message: "User is deleted" });
    } catch (err) {
      console.error("Error deleting user:", err);
      return res.status(500).json({ error: "Error occurred" });
    }
  }

  res.status(400).json({ error: "Unhandled event type" });
}
