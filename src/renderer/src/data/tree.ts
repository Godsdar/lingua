import type { LangCode } from '@shared/types'

export interface TreeNode {
  name: string
  lang?: LangCode
  highlight?: boolean
  children?: TreeNode[]
}

export const TREE: TreeNode = {
  name: 'Proto-Indo-European',
  children: [
    { name: 'Anatolian †', children: [{ name: 'Hittite †' }, { name: 'Luwian †' }] },
    {
      name: 'Indo-Iranian',
      children: [
        { name: 'Indo-Aryan', children: [{ name: 'Hindi' }, { name: 'Bengali' }] },
        { name: 'Iranian', children: [{ name: 'Persian' }, { name: 'Kurdish' }] }
      ]
    },
    { name: 'Greek', children: [{ name: 'Modern Greek' }] },
    {
      name: 'Italic',
      children: [
        {
          name: 'Latin †',
          children: [
            {
              name: 'Romance',
              children: [
                { name: 'Spanish', lang: 'es', highlight: true },
                { name: 'French', lang: 'fr', highlight: true },
                { name: 'Italian' },
                { name: 'Portuguese' }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'Germanic',
      children: [
        { name: 'English', lang: 'en', highlight: true },
        { name: 'German' },
        { name: 'North Germanic', children: [{ name: 'Swedish' }, { name: 'Norwegian' }] }
      ]
    },
    {
      name: 'Balto-Slavic',
      children: [
        { name: 'Baltic', children: [{ name: 'Lithuanian' }, { name: 'Latvian' }] },
        {
          name: 'Slavic',
          children: [
            { name: 'Russian', lang: 'ru', highlight: true },
            { name: 'Polish' },
            { name: 'Czech' }
          ]
        }
      ]
    },
    { name: 'Celtic', children: [{ name: 'Irish' }, { name: 'Welsh' }] },
    { name: 'Armenian', children: [{ name: 'Armenian' }] },
    { name: 'Albanian', children: [{ name: 'Albanian' }] }
  ]
}
