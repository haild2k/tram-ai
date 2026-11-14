import { registerRoot } from "remotion";
import { EthSai } from "./videos/eth-sai-07-11";
import { EthSaiEn } from "./videos/eth-sai-07-11-en";

const Root: React.FC = () => (
  <>
    <EthSai />
    <EthSaiEn />
  </>
);

registerRoot(Root);
