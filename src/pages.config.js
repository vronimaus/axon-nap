import Dashboard from './pages/Dashboard';
import DiagnosisWizard from './pages/DiagnosisWizard';
import Performance from './pages/Performance';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "DiagnosisWizard": DiagnosisWizard,
    "Performance": Performance,
}

export const pagesConfig = {
    mainPage: "DiagnosisWizard",
    Pages: PAGES,
    Layout: __Layout,
};