import Link from "next/link";
import { slug } from "github-slugger";
import { allTags } from "contentlayer/generated";
import { useTranslations } from "next-intl";

interface Props {
  text: string;
}

const Tag = ({ text }: Props) => {
  const l = useTranslations("lang");
  const tagsList =
    allTags.find((i) => i.language === l("locale"))?.tagsMap || {};

  return (
    <Link
      href={`/tags/${slug(text)}`}
      className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 mr-3 text-sm font-medium uppercase"
    >
      {tagsList[text].split(" ").join("-")}
    </Link>
  );
};

export default Tag;
