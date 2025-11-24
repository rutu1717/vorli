import { Box, Button, Menu, MenuItem, Portal, Text } from "@chakra-ui/react";
import { LANGUAGE_VERSIONS } from "@/constants";
import { CODE_SNIPPETS } from "@/constants";
export type Language = keyof typeof CODE_SNIPPETS;
const lang_array = Object.entries(LANGUAGE_VERSIONS);
interface LanguageSelectorProps {
  language: Language;
  onSelect: (language: Language) => void;
}
const LanguageSelector: React.FC<LanguageSelectorProps> = ({language,onSelect}) => {
    return (
        <Box>
            <Text color="grey" mb={2} fontSize="lg">Language :</Text>
             <Menu.Root>
      <Menu.Trigger asChild>
        <Button color="grey" variant="outline" mb={4} size="lg">
          {language}
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            {
                lang_array.map(([languages,version])=>(
                    <MenuItem  value={languages} color={languages===language ? "blue.500":""} backgroundColor={languages===language ? "grey.700":""} key={languages} onClick={()=>{onSelect(languages as Language)}}>{languages}
                    <Text color="grey">({version})</Text>
                    </MenuItem>
                ))
            }
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
        </Box>
    )
}
export default LanguageSelector;