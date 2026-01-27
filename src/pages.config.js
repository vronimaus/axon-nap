import DiagnosisWizard from './pages/DiagnosisWizard';
import Dashboard from './pages/Dashboard';
import Performance from './pages/Performance';
import __Layout from './Layout.jsx';


export const PAGES = {
    "DiagnosisWizard": DiagnosisWizard,
    "Dashboard": Dashboard,
    "Performance": Performance,
}

export const pagesConfig = {
    mainPage: "DiagnosisWizard",
    Pages: PAGES,
    Layout: __Layout,
};