/** Đồng bộ với `MENU_ITEM_TAG_VALUES` ở back-end DTO. */
export const MENU_ITEM_TAG_IDS = ["BEST_SELLER", "RECOMMENDED", "CHEFS_PICK", "NEW"] as const;
export type MenuItemTagId = (typeof MENU_ITEM_TAG_IDS)[number];

export function isMenuItemTagId(v: string): v is MenuItemTagId {
    return (MENU_ITEM_TAG_IDS as readonly string[]).includes(v);
}
