const GradeEntryView = () => import('../views/grading/GradeEntryView.vue');
const GradeOverrideView = () => import('../views/grading/GradeOverrideView.vue');
const StudentGradeCardView = () => import('../views/grading/StudentGradeCardView.vue');
const TagsNotesView = () => import('../views/grading/TagsNotesView.vue');


export default [
    {
        path: '/grading/entry',
        name: 'grading.entry',
        component: GradeEntryView,
    },
    {
        path: '/grading/overrides',
        name: 'grading.overrides',
        component: GradeOverrideView,
    },
    {
        path: '/grading/students/:studentId?',
        name: 'grading.student-card',
        component: StudentGradeCardView,
        props: true,
    },
    {
        path: '/grading/tags-notes',
        name: 'grading.tags-notes',
        component: TagsNotesView,
    },
];
