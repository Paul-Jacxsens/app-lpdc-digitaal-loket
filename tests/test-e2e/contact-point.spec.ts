import {expect, Page, test} from "@playwright/test";
import {MockLoginPage} from "./pages/mock-login-page";
import {LpdcHomePage} from "./pages/lpdc-home-page";
import {AddProductOrServicePage as ProductOfDienstToevoegenPage} from "./pages/product-of-dienst-toevoegen-page";
import {InstantieDetailsPage} from "./pages/instantie-details-page";
import {UJeModal} from "./modals/u-je-modal";
import {v4 as uuid} from 'uuid';
import {WijzigingenBewarenModal} from "./modals/wijzigingen-bewaren-modal";
import {first_row} from './components/table';
import {VerzendNaarVlaamseOverheidModal} from "./modals/verzend-naar-vlaamse-overheid-modal";

test.describe('Contact point form fields', () => {

    let page: Page;
    let mockLoginPage: MockLoginPage;
    let homePage: LpdcHomePage;
    let toevoegenPage: ProductOfDienstToevoegenPage;
    let instantieDetailsPage: InstantieDetailsPage;
    let wijzigingenBewarenModal : WijzigingenBewarenModal;
    let verzendNaarVlaamseOverheidModal: VerzendNaarVlaamseOverheidModal;

    test.beforeEach(async ({browser}) => {
        page = await browser.newPage();
        mockLoginPage = MockLoginPage.createForLpdc(page);
        homePage = LpdcHomePage.create(page);

        toevoegenPage = ProductOfDienstToevoegenPage.create(page);
        instantieDetailsPage = InstantieDetailsPage.create(page);
        wijzigingenBewarenModal = WijzigingenBewarenModal.create(page);
        verzendNaarVlaamseOverheidModal = VerzendNaarVlaamseOverheidModal.create(page);

        await mockLoginPage.goto();
        await mockLoginPage.searchInput.fill('Pepingen');
        await mockLoginPage.login('Gemeente Pepingen');

        await homePage.expectToBeVisible();

        const uJeModal = UJeModal.create(page);
        await uJeModal.expectToBeVisible();
        await uJeModal.laterKiezenButton.click();
        await uJeModal.expectToBeClosed();
    });

    test.afterEach(async () => {
        await page.close();
    });

    test('Contact point info fields should show list items from existing instances', async () => {

        await homePage.productOfDienstToevoegenButton.click();

        await toevoegenPage.expectToBeVisible();
        await toevoegenPage.volledigNieuwProductToevoegenButton.click();

        await instantieDetailsPage.expectToBeVisible();

        await instantieDetailsPage.voegContactpuntToeButton.click();
        const email = `${uuid()}@example.com`
        await instantieDetailsPage.contactpuntEmailSelect.insertNewValue(email);
        const telefoon = '0499123123';
        await instantieDetailsPage.contactpuntTelefoonSelect.insertNewValue(telefoon);
        const websiteUrl = `https://${uuid()}.be`;
        await instantieDetailsPage.contactpuntWebsiteURLSelect.insertNewValue(websiteUrl);
        const openingsuren = `https://${uuid()}.be`;
        await instantieDetailsPage.contactpuntOpeningsurenSelect.insertNewValue(openingsuren);

        await instantieDetailsPage.voegAdresToeButton.click();
        await instantieDetailsPage.contactpuntAdresGemeenteSelect.selectValue('Harelbeke');
        await instantieDetailsPage.contactpuntAdresStraatSelect.selectValue('Generaal Deprezstraat');
        await instantieDetailsPage.contactpuntAdresHuisnummerInput.fill('2');
        await instantieDetailsPage.contactpuntAdresBusnummerInput.fill('50');
        await expect(instantieDetailsPage.contactpuntAdresValidatie).toContainText('Adres gevonden');
        await expect(instantieDetailsPage.contactpuntAdresValidatie).toContainText('Generaal Deprezstraat 2 bus 0050, 8530 Harelbeke');

        await instantieDetailsPage.terugNaarHetOverzichtButton.click();
        await wijzigingenBewarenModal.expectToBeVisible();
        await wijzigingenBewarenModal.bewaarButton.click();
        await wijzigingenBewarenModal.expectToBeClosed();

        await homePage.expectToBeVisible();
        await homePage.productOfDienstToevoegenButton.click();

        await toevoegenPage.expectToBeVisible();
        await toevoegenPage.volledigNieuwProductToevoegenButton.click();

        await instantieDetailsPage.voegContactpuntToeButton.click();

        expect(await instantieDetailsPage.contactpuntEmailSelect.searchValue(email)).toEqual(email);
        expect(await instantieDetailsPage.contactpuntTelefoonSelect.searchValue(telefoon)).toEqual(telefoon);
        expect(await instantieDetailsPage.contactpuntWebsiteURLSelect.searchValue(websiteUrl)).toEqual(websiteUrl);
        expect(await instantieDetailsPage.contactpuntOpeningsurenSelect.searchValue(openingsuren)).toEqual(openingsuren);
    });

    test('Adres should show correct validation alert message', async () => {

        await homePage.productOfDienstToevoegenButton.click();

        await toevoegenPage.expectToBeVisible();
        await toevoegenPage.volledigNieuwProductToevoegenButton.click();

        await instantieDetailsPage.expectToBeVisible();

        await instantieDetailsPage.voegContactpuntToeButton.click();
        await instantieDetailsPage.voegAdresToeButton.click();

        await instantieDetailsPage.contactpuntAdresGemeenteSelect.selectValue('Harelbeke');
        await expect(page.getByRole('alert')).toContainText('Niet genoeg info om adres te valideren');
        await instantieDetailsPage.contactpuntAdresStraatSelect.selectValue('Generaal Deprezstraat');
        await instantieDetailsPage.contactpuntAdresHuisnummerInput.fill('2');
        await instantieDetailsPage.contactpuntAdresBusnummerInput.fill('50');
        await expect(page.getByRole('alert')).toContainText('Adres gevonden');
        await expect(page.getByRole('alert')).toContainText('Generaal Deprezstraat 2 bus 0050, 8530 Harelbeke');

        await instantieDetailsPage.contactpuntAdresGemeenteSelect.selectValue('Aarschot');
        await instantieDetailsPage.contactpuntAdresStraatSelect.selectValue('kerkstraat');
        await instantieDetailsPage.contactpuntAdresHuisnummerInput.fill('120');
        await expect(page.getByRole('alert')).toContainText('Adres niet gevonden');

        await instantieDetailsPage.contactpuntAdresGemeenteSelect.selectValue('Leuven');
        await expect(page.getByRole('alert')).toContainText('Niet genoeg info om adres te valideren');
    });

    test('Publishing address should give error if at least one adres is not valid', async () => {

        await homePage.productOfDienstToevoegenButton.click();

        await toevoegenPage.expectToBeVisible();
        await toevoegenPage.resultTable.row(first_row).link('Voeg toe').click();

        await instantieDetailsPage.expectToBeVisible();

        const titel = await instantieDetailsPage.titelInput.inputValue();
        expect(titel).toEqual(`Akte van Belgische nationaliteit - nl`);
        const newTitel = titel + uuid();
        await instantieDetailsPage.titelInput.fill(newTitel);

        await instantieDetailsPage.voegContactpuntToeButton.click();
        await instantieDetailsPage.voegAdresToeButton.click();

        await instantieDetailsPage.contactpuntAdresGemeenteSelect.selectValue('Harelbeke');
        await instantieDetailsPage.contactpuntAdresStraatSelect.selectValue('Generaal Deprezstraat');
        await instantieDetailsPage.contactpuntAdresHuisnummerInput.fill('2');
        await instantieDetailsPage.contactpuntAdresBusnummerInput.fill('50');
        await expect(instantieDetailsPage.contactpuntAdresValidatie).toContainText('Adres gevonden');
        await expect(instantieDetailsPage.contactpuntAdresValidatie).toContainText('Generaal Deprezstraat 2 bus 0050, 8530 Harelbeke');

        await instantieDetailsPage.voegContactpuntToeButton.click();
        await instantieDetailsPage.voegAdresToeButton.click();
        
        await instantieDetailsPage.secondContactpuntAdresGemeenteSelect.selectValue('Aarschot');
        await instantieDetailsPage.secondContactpuntAdresStraatSelect.selectValue('Kerkstraat');
        await instantieDetailsPage.secondContactpuntAdresHuisnummerInput.fill('120');
        await expect(instantieDetailsPage.secondContactpuntAdresValidatie).toContainText('Adres niet gevonden');

        await instantieDetailsPage.verzendNaarVlaamseOverheidButton.click();

        await verzendNaarVlaamseOverheidModal.expectToBeVisible();
        await verzendNaarVlaamseOverheidModal.verzendNaarVlaamseOverheidButton.click();
        await verzendNaarVlaamseOverheidModal.expectToBeClosed();

        await expect(page.locator('div.au-c-toaster')).toContainText("Minstens één van de adressen is niet geldig, Gelieve deze te verbeteren!");

        await instantieDetailsPage.terugNaarHetOverzichtButton.click();

        await homePage.expectToBeVisible();
        await homePage.searchInput.fill(newTitel);

        await expect(homePage.resultTable.row(first_row).locator).toContainText(newTitel);
        await homePage.resultTable.row(first_row).link('Bewerk').click();

        await expect(instantieDetailsPage.contactpuntAdresGemeenteSelect.selectedItem).toContainText('Harelbeke');
        await expect(instantieDetailsPage.contactpuntAdresStraatSelect.selectedItem).toContainText('Generaal Deprezstraat');
        await expect(instantieDetailsPage.contactpuntAdresHuisnummerInput).toHaveValue('2');
        await expect(instantieDetailsPage.contactpuntAdresBusnummerInput).toHaveValue('50');
        await expect(instantieDetailsPage.contactpuntAdresBusnummerInput).toHaveValue('50');
        await expect(instantieDetailsPage.contactpuntAdresValidatie).toContainText('Adres gevonden');
        await expect(instantieDetailsPage.contactpuntAdresValidatie).toContainText('Generaal Deprezstraat 2 bus 0050, 8530 Harelbeke');

        await expect(instantieDetailsPage.secondContactpuntAdresGemeenteSelect.selectedItem).toContainText('Aarschot');
        await expect(instantieDetailsPage.secondContactpuntAdresStraatSelect.selectedItem).toContainText('Kerkstraat');
        await expect(instantieDetailsPage.secondContactpuntAdresHuisnummerInput).toHaveValue('120');
        await expect(instantieDetailsPage.secondContactpuntAdresBusnummerInput).toHaveValue('');
        await expect(instantieDetailsPage.secondContactpuntAdresValidatie).toContainText('Adres niet gevonden');
    });

});
