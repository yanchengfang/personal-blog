"use client";

import { SearchProvider } from "pliny/search";
import type { SearchConfig } from "pliny/search";
import { KBarIntlProvider } from "./KBarIntlProvider";

type Props = {
  searchConfig: SearchConfig;
  children: React.ReactNode;
};

export default function AppSearchProvider({ searchConfig, children }: Props) {
  if (!searchConfig?.provider) {
    return children;
  }

  if (searchConfig.provider === "kbar") {
    return (
      <KBarIntlProvider kbarConfig={searchConfig.kbarConfig}>
        {children}
      </KBarIntlProvider>
    );
  }

  return (
    <SearchProvider searchConfig={searchConfig}>{children}</SearchProvider>
  );
}
