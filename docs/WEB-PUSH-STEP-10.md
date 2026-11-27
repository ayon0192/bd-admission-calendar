# ধাপ ১০ — Web Push (ঐচ্ছিক, এখনো বাস্তবায়িত নয়)

বর্তমান repository snapshot-এ Cloudflare Worker ও Pages Functions source ইচ্ছাকৃতভাবে অন্তর্ভুক্ত নয়। পুরোনো UpdateHub deployment workflow এবং তার Worker-specific tests-ও সরানো হয়েছে, যাতে অনুপস্থিত backend-এর জন্য CI ব্যর্থ না হয় বা Cloudflare credentials ছাড়া কোনো deploy job না চলে।

বর্তমান ব্যবহারযোগ্য reminder হলো browser থেকে তৈরি `.ics` calendar file (Blueprint step 9.5, ধাপ ক)। এটি server বা push permission ছাড়াই কাজ করে।

Web Push চালু করার আগে নতুন করে নকশা, implementation ও security review প্রয়োজন:

1. Worker ও Pages Function source এবং deployment configuration তৈরি করা।
2. Same-origin subscription/unsubscription API ও ownership checks বাস্তবায়ন করা।
3. VAPID key pair Worker secrets-এ রাখা; repository বা client source-এ কখনো private key রাখা যাবে না।
4. Reminder payload, endpoint allowlist, retry/expiry, idempotency এবং user-controlled opt-in পরীক্ষা করা।
5. প্রয়োজনীয় Cloudflare bindings ও সীমিত API token permissions দিয়ে deployment pipeline যোগ করা।
6. Worker integration tests, Pages Function tests ও end-to-end delivery checks যোগ করা।

এই ধাপের আগে এই repository-তে Worker deployment workflow বা `UPDATE_HUB` Durable Object binding যোগ করা যাবে না।
