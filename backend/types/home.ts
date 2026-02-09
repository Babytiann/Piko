/** Data contract for the Home page. */

export interface WelcomeCard {
  title: string;
  description: string;
}

export interface HomePageData {
  header: { title: string };
  welcomeCard: WelcomeCard;
}
