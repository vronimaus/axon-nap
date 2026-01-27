import Dashboard from './pages/Dashboard';
import DiagnosisWizard from './pages/DiagnosisWizard';
import Performance from './pages/Performance';
import ExerciseImageGenerator from './pages/ExerciseImageGenerator';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "DiagnosisWizard": DiagnosisWizard,
    "Performance": Performance,
    "ExerciseImageGenerator": ExerciseImageGenerator,
}

export const pagesConfig = {
    mainPage: "DiagnosisWizard",
    Pages: PAGES,
    Layout: __Layout,
};