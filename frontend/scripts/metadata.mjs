import fs from "fs";
import { fetchPrivate } from "@stacks/common";
import { webcrypto } from "crypto";

const boomIds = [1, 5535, 5957, 5587, 5588, 5615, 5632];
const attributes = {
  7: "D7 One self-paying loan away from freedom. Small loan for man, big loan for humanibtc.",
  6: "D6 Golden reflections. You will be long a city, artist and Community.",
  5: "D5 Sunrise run. Meditation thru Diko's lenses. He gives an unthinkable hand.",
  4: "D4 New beginnings under the clouds: close up on the life cycles of empires.",
  3: "D3 100 miles minus 7. Shush! Doing it right!",
  2: "D2 14.5 miles. Hope is in the wind.",
  1: "D1 Day one will also be day end.",
};

async function readMetadata() {
  const content = fs.readFileSync("./data/exported-txs.csv").toString();
  const lines = content.split("\n");
  let days = lines
    .filter((l) => l)
    .map((l) => {
      const fields = l.split(",");
      const boomId = parseInt(fields[6].substr(34, 4));
      let name = fields[10].trim().substr(4);
      name = name.substr(0, name.indexOf('"')).trim();
      const hash = fields[13].substr(22, 64);
      const imageUrl = fields[11];
      return {
        boomId,
        name,
        hash,
        imageUrl,
      };
    });
  days = days.filter((r) => boomIds.find((id) => id === r.boomId));
  days = boomIds.map((id, index) => {
    const day = days.find((r) => r.boomId === id);
    return { ...day, id: index + 1 };
  });

  return days;
}

async function urlContentToDataUri(data) {
  const b64 = data.toString("base64");
  return `data:image/jpeg;base64,${b64}`;
}

async function digest(imageDataUrl) {
  return await webcrypto.subtle.digest(
    "SHA-256",
    Buffer.from(await imageDataUrl, "base64")
  );
}
async function downloadImages(days) {
  const hashToId = {};
  for (let r of days) {
    console.log(r);
    if (!r.imageUrl) {
      continue;
    }
    const response = await fetchPrivate(r.imageUrl);
    const data = await response.buffer();
    const dataUri = await urlContentToDataUri(data);
    const hash = await digest(dataUri);

    fs.writeFileSync(`data/metadata/nfts/day${r.id}.jpeg`, data);
    const hashString = Buffer.from(hash).toString("hex");
    if (hashToId[hashString]) {
      console.log("**** " + hashToId[hashString]);
    }
    hashToId[hashString] = r.id;
    if (r.hash !== hashString) {
      console.log({ r });
    }
  }
}
function getName(day) {
  if (attributes[day.id]) {
    return attributes[day.id];
  } else {
    return day.name;
  }
}

function writeMetadata(days) {
  try {
    fs.rmSync("data/metadata/metadata", { recursive: true });
  } catch (e) {
    console.log(e);
  }

  fs.mkdirSync("data/metadata/metadata", { recursive: true });
  for (let r of days) {
    fs.writeFileSync(
      `data/metadata/metadata/${r.id}.json`,
      JSON.stringify({
        version: 1,
        name: getName(r),
        image: `ipfs://QmQhmPbVbXYnSTk7Z3i6GmiAYyL75ys1ZrJPNnXnBs4ch4/day${r.id}.jpeg`,
        properties: {
          collection: "BTC Days",
          creator: { type: "string", value: "Benny Cage" },
          boomId: { type: "number", value: r.boomId },
          boomHash: { type: "string", value: r.hash },
        },
      })
    );
  }
}

readMetadata().then((days) => {
  console.log(days.length);
  downloadImages(days);
  writeMetadata(days);
});
