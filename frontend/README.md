# Weed-Zap dashboard

A standalone, static dashboard prototype for the Weed-Zap project. It uses mock activity based on the documented PC simulation; it does not connect to the robot or report real battery, camera, or field telemetry.

From the project root, run:

```sh
npm run dev --workspace frontend
```

Then open `http://127.0.0.1:4173`. You can also open the project-root `index.html` directly in a browser. The demo supports overview, detection filters, patrol history, and replaying the sample run.
