import { Paper, Text } from "@mantine/core";
import classes from "./TextContent.module.css";

export type TextContentProps = {
  text: string;
};

export const TextContent: React.FC<TextContentProps> = ({ text }) => {
  return (
    <Paper
      className={classes.text}
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      <Text
        component="pre"
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontFamily: "inherit",
        }}>
        {text}
      </Text>
    </Paper>
  );
};
