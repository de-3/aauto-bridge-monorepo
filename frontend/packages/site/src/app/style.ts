import { extendTheme, withDefaultColorScheme } from '@chakra-ui/react'

export const theme = extendTheme(
  {
    config: {},
    colors: {
      primary: {
        500: '#546EF3',
      },
    },
  },
  withDefaultColorScheme({ colorScheme: 'primary' }),
)
