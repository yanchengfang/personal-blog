'use client'

import { usePathname, useRouter } from '@/i18n/routing'
import { useParams } from 'next/navigation'

export default function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()

  const switchLanguage = (lang: string) => {
    // next-intl 的 router.replace 会自动处理语言前缀，不需要手动拼接 http://localhost:3000
    // 这将解决 Failed to fetch RSC payload 错误，因为它现在是一个正常的客户端导航
    router.replace(
      // @ts-expect-error -- pathname stays the same, only locale changes
      { pathname, params },
      { locale: lang }
    )
  }

  return (
    <div className="flex gap-4 p-4">
      <button 
        onClick={() => switchLanguage('zh')}
        className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-primary-500 dark:text-gray-200"
      >
        简体中文
      </button>
      <button 
        onClick={() => switchLanguage('en')}
        className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-primary-500 dark:text-gray-200"
      >
        English
      </button>
    </div>
  )
}
