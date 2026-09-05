# Close ports when finishing work

When you start a long-running process that binds a port for this repo (`nest start`, `npm run start:dev` in `apps/api`, `npm run dev` / `next dev` in `apps/web`, Docker-mapped DB/services, etc.):

1. Track the PIDs / ports you opened in the session.
2. Before ending your turn after the task is complete (or when the user asks to wrap up), stop those processes and free the ports.
3. Prefer killing only processes you started - do not kill unrelated user servers unless asked.
4. Verify the port is no longer listening after shutdown.
5. Do not leave background Nest / Next servers running after verification unless the user explicitly wants them left up.
