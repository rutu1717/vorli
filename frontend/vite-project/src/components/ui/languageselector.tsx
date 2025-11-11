import { Box, Button, Menu, MenuItem, Portal, Text } from "@chakra-ui/react";
import { LANGUAGE_VERSIONS } from "@/constants";
const lang_array = Object.entries(LANGUAGE_VERSIONS);
interface LanguageSelectorProps {
  language: string;
  onSelect: (language: string) => void;
}
const LanguageSelector: React.FC<LanguageSelectorProps> = ({language,onSelect}) => {
    return (
        <Box>
            <Text color="grey" mb={2} fontSize="lg">Language :</Text>
             <Menu.Root>
      <Menu.Trigger asChild>
        <Button variant="outline" mb={4} size="sm">
          {language}
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            {
                lang_array.map(([languages,version])=>(
                    <MenuItem value={languages} key={languages} onClick={()=>{onSelect(languages)}}>{languages}
                    <Text>{version}</Text>
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