import { genesisIcons } from "@formkit/icons"
import { rootClasses } from "./formkit.theme"
import { DefaultConfigOptions } from '@formkit/vue'
import { createProPlugin, inputs } from '@formkit/pro'
import { createLocalStoragePlugin } from '@formkit/addons'

const pro = createProPlugin('fk-6b3e4cf06a8', inputs)

const config: DefaultConfigOptions = {
  plugins: [
    pro,
    createLocalStoragePlugin({
      prefix: 'form',
      key: undefined,
      control: undefined,
      maxAge: 3600000, // 1 hour
      debounce: 200,
      beforeSave: undefined,
      beforeLoad: undefined
    }),
  ],
  icons: { ...genesisIcons },
  config: { rootClasses }
}

export default config
