import { Button, Menu } from "@mantine/core";
import { IconDots } from "@/icons/IconDots";

export type ConversationsMenuProps = {
  onSync: () => void;
  onSyncAll: () => void;
  disabled?: boolean;
};

export const ConversationsMenu: React.FC<ConversationsMenuProps> = ({
  onSync,
  onSyncAll,
  disabled,
}) => {
  return (
    <Menu shadow="md" disabled={disabled} position="bottom-end">
      <Menu.Target>
        <button className="btn btn-secondary" type="button">
          <IconDots />
        </button>
      </Menu.Target>
      <Menu.Dropdown miw={200}>
        <Menu.Label>Actions</Menu.Label>
        <Menu.Item onClick={onSync}>Sync</Menu.Item>
        <Menu.Item onClick={onSyncAll}>Sync All</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
