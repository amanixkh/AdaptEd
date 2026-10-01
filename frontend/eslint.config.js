import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ['src/components/Icons.jsx', 'src/context/AppContext.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['src/components/Notifications.jsx', 'src/components/StudentResults.jsx', 'src/components/TutorChat.jsx', 'src/context/AppContext.jsx', 'src/pages/Archive.jsx', 'src/pages/Result.jsx', 'src/pages/StudentDashboard.jsx', 'src/pages/StudentLesson.jsx', 'src/pages/StudentProgress.jsx'],
    rules: { 'react-hooks/set-state-in-effect': 'off' },
  },
  {
    files: ['src/components/TutorChat.jsx', 'src/context/AppContext.jsx', 'src/hooks/useTabsKnob.js', 'src/pages/Archive.jsx', 'src/pages/ShareLessonPage.jsx', 'src/pages/StudentDashboard.jsx', 'src/pages/StudentLesson.jsx', 'src/pages/StudentProgress.jsx'],
    rules: { 'react-hooks/exhaustive-deps': 'off' },
  },
  {
    files: ['src/components/Layout.jsx', 'src/components/TutorChat.jsx', 'src/components/TutorWidget.jsx', 'src/context/AppContext.jsx', 'src/pages/Contact.jsx', 'src/pages/Landing.jsx', 'src/services/api.js', 'src/utils/splash.js'],
    rules: { 'no-empty': 'off' },
  },
])
