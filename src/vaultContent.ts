export type VaultStatusKey = "Vaulted" | "Listed" | "Sold" | "Redeem queued";

export type VaultGuideContent = {
  actions: string[];
  actionsTitle: string;
  intro: string;
  principle: string;
  principleTitle: string;
  statusTitle: string;
  statuses: { meaning: string; status: VaultStatusKey }[];
};

export const vaultContent: Record<"en" | "ko", VaultGuideContent> = {
  en: {
    intro: "The Iruka vault is the custody layer for verified physical inventory.",
    actionsTitle: "What the vault does",
    actions: [
      "Held in storage",
      "Listed on the marketplace",
      "Sold",
      "Queued for redemption and shipping"
    ],
    statusTitle: "Vault statuses",
    statuses: [
      { status: "Vaulted", meaning: "Stored and available for future actions." },
      { status: "Listed", meaning: "Listed on the marketplace." },
      { status: "Sold", meaning: "Sold through a marketplace or exit flow." },
      { status: "Redeem queued", meaning: "User requested shipment." }
    ],
    principleTitle: "Custody principle",
    principle:
      "Iruka only shows an item as vaulted when internal records prove custody, verification, and redemption eligibility."
  },
  ko: {
    intro: "Iruka 보관함은 검증된 실물 재고를 지키는 커스터디 레이어입니다.",
    actionsTitle: "보관함에서 할 수 있는 것",
    actions: ["안전 보관", "마켓플레이스 리스팅", "판매", "배송 신청 대기"],
    statusTitle: "보관 상태",
    statuses: [
      { status: "Vaulted", meaning: "보관 중이며 다음 액션을 진행할 수 있어요." },
      { status: "Listed", meaning: "마켓플레이스에 등록된 상태예요." },
      { status: "Sold", meaning: "마켓플레이스 또는 정산 플로우로 판매됐어요." },
      { status: "Redeem queued", meaning: "사용자가 배송을 신청한 상태예요." }
    ],
    principleTitle: "커스터디 원칙",
    principle:
      "Iruka는 내부 기록으로 보관, 검증, 배송 가능 여부가 확인된 아이템만 보관중으로 표시합니다."
  }
};
