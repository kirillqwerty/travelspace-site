import { useSyncExternalStore } from "react";
import { Seo } from "@/components/Seo";
import { getPageBootstrap, isPageMounted, subscribePageMount } from "@/lib/pageBootstrap";

export default function BootstrapSeo() {
  const ready = useSyncExternalStore(subscribePageMount, isPageMounted, () => false);
  const page = getPageBootstrap();
  // Helmet must know the server tags before analytics or lazy routes mount.
  // Otherwise the first unrelated Helmet instance may remove those tags.
  return !ready && page ? <Seo serverSeo={page.seo} path={page.path} /> : null;
}
