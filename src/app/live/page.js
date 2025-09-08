import LiveClientComponent from "./LiveClientComponent";
import { Suspense } from "react";

import { fetchM3U } from "../../helper/m3uFetcher";
import BackLight from "@/components/backLigth/BackLight";
import StreamNavigation from "@/components/stream/StreamNavigation";

const DEFAULT_M3U_URL = process.env.NEXT_PUBLIC_DEFAULT_M3U_URL;

const LivePage = async () => {
  const initialChannels = await fetchM3U(DEFAULT_M3U_URL);

  return (
    <>
      <BackLight />
      <StreamNavigation />
      <Suspense fallback={<div>Loading...</div>}>
        <LiveClientComponent serverInitialChannels={initialChannels} />
      </Suspense>
    </>
  );
};

export default LivePage;
