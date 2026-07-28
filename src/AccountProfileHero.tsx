import accountIdols from "./assets/account-idols-transparent.png";
import accountCover from "./assets/iruka-entry-sky-ocean.png";

type AccountProfileHeroProps = {
  accountLabel: string;
  inventoryLabel: string;
  overviewLabel: string;
};

export function AccountProfileHero({
  accountLabel,
  inventoryLabel,
  overviewLabel
}: AccountProfileHeroProps) {
  return (
    <article className="account-profile-hero">
      <img alt="" className="account-profile-cover" src={accountCover} />
      <span aria-hidden="true" className="account-profile-shade" />
      <img alt="" className="account-profile-idols" src={accountIdols} />
      <h1 className="sr-only">{accountLabel}</h1>

      <nav aria-label={accountLabel} className="account-profile-nav">
        <a className="selected" href="#account-overview">
          <img
            alt=""
            aria-hidden="true"
            className="account-nav-icon"
            src="/assets/iruka-icon-overview.png"
          />
          {overviewLabel}
        </a>
        <a href="#account-inventory">
          <img
            alt=""
            aria-hidden="true"
            className="account-nav-icon"
            src="/assets/iruka-icon-inventory.png"
          />
          {inventoryLabel}
        </a>
      </nav>
    </article>
  );
}
