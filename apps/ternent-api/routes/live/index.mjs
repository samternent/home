import NodeMediaServer from "node-media-server";

const httpConfig = {
  port: 3001,
  allow_origin: "*",
  mediaroot: "./media",
};

const rtmpConfig = {
  port: 1935,
  chunk_size: 60000,
  gop_cache: true,
  ping: 10,
  ping_timeout: 60,
};

const transformationConfig = {
  ffmpeg: "./ffmpeg",
  tasks: [
    {
      app: "live",
      hls: true,
      hlsFlags: "[hls_time=2:hls_list_size=3:hls_flags=delete_segments]",
      hlsKeep: false,
    },
  ],
  MediaRoot: "./media",
};

const config = {
  http: httpConfig,
  rtmp: rtmpConfig,
  trans: transformationConfig,
};

export default function createMediaServer() {
  const nms = new NodeMediaServer(config);

  nms.run();

  nms.on("preConnect", (id, args) => {
    console.log(
      "[NodeEvent on preConnect]",
      `id=${id} args=${JSON.stringify(args)}`
    );
    // let session = nms.getSession(id);
    // session.reject();
  });

  nms.on("postConnect", (id, args) => {
    console.log(
      "[NodeEvent on postConnect]",
      `id=${id} args=${JSON.stringify(args)}`
    );
  });

  nms.on("doneConnect", (id, args) => {
    console.log(
      "[NodeEvent on doneConnect]",
      `id=${id} args=${JSON.stringify(args)}`
    );
  });

  nms.on("prePublish", (id, StreamPath, args) => {
    console.log(
      "[NodeEvent on prePublish]",
      `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
    );
    // Implement authentication for your streamers...
    // let session = nms.getSession(id);
    // session.reject();
  });

  nms.on("postPublish", (id, StreamPath, args) => {
    console.log(
      "[NodeEvent on postPublish]",
      `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
    );
  });

  nms.on("donePublish", (id, StreamPath, args) => {
    console.log(
      "[NodeEvent on donePublish]",
      `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
    );
  });

  nms.on("prePlay", (id, StreamPath, args) => {
    console.log(
      "[NodeEvent on prePlay]",
      `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
    );
    // let session = nms.getSession(id);
    // session.reject();
  });

  nms.on("postPlay", (id, StreamPath, args) => {
    console.log(
      "[NodeEvent on postPlay]",
      `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
    );
  });

  nms.on("donePlay", (id, StreamPath, args) => {
    console.log(
      "[NodeEvent on donePlay]",
      `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
    );
  });
}
