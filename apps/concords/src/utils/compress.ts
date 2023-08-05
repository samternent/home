import { ILedger } from "concords-proof-of-work";
import { b64encode, b64decode } from "concords-utils";

export async function compress(ledger: ILedger) {
  const stream = new Blob([JSON.stringify(ledger)], {
    type: "text/plain",
  }).stream();

  const compressedReadableStream = stream.pipeThrough(
    new CompressionStream("gzip")
  );

  const resp = await new Response(compressedReadableStream);
  const blob = await resp.blob();

  const buffer = await blob.arrayBuffer();
  return { blob, buffer };
}

export async function decompress(ledger: string) {
  const stream = new Blob([b64decode(ledger)], {
    type: "text/plain",
  }).stream();

  const compressedReadableStream = stream.pipeThrough(
    new DecompressionStream("gzip")
  );

  const resp = await new Response(compressedReadableStream);
  const blob = await resp.blob();

  return JSON.parse(await blob.text());
}
