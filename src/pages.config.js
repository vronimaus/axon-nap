import DiagnosisWizard from './pages/DiagnosisWizard';
import Dashboard from './pages/Dashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "DiagnosisWizard": DiagnosisWizard,
    "Dashboard": Dashboard,
}

export const pagesConfig = {
    mainPage: "DiagnosisWizard",
    Pages: PAGES,
    Layout: __Layout,
};