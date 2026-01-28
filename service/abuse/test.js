import MemoryStore from "../storage/MemoryStore.js";
import AbuseDetector from "./AbuseDetector.js";


const store = new MemoryStore();
const detector = new AbuseDetector(store, {threshold: 3, banTime: 10});

for (let i = 0; i < 15; i++) {
  const result = await detector.record("user1", false);
  console.log(result);
  await new Promise(r => setTimeout(r, 1000));
}