"use client";

import { PageContainer } from "@/components/page-container";
import { FormattedMessage } from "react-intl";
import {
    ShoppingBasket,
    PlusCircle,
    CheckCircle,
    Edit2,
    Tags,
    ClipboardList,
    Settings,
    Bell,
    Share2,
    Star,
    RefreshCw,
    Smartphone,
    Users,
    List,
    BookOpen,
} from "lucide-react";

interface FeatureSectionProps {
    icon: React.ReactNode;
    titleId: string;
    titleDefault: string;
    descId: string;
    descDefault: string;
    steps?: { id: string; defaultMessage: string }[];
    color: string;
}

function FeatureSection({ icon, titleId, titleDefault, descId, descDefault, steps, color }: FeatureSectionProps) {
    return (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
            <div className={`flex items-center gap-3 px-5 py-4 ${color}`}>
                <span className="text-white">{icon}</span>
                <h2 className="text-base font-bold text-white">
                    <FormattedMessage id={titleId} defaultMessage={titleDefault} />
                </h2>
            </div>
            <div className="px-5 py-4 space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    <FormattedMessage id={descId} defaultMessage={descDefault} />
                </p>
                {steps && steps.length > 0 && (
                    <ol className="space-y-2 mt-1">
                        {steps.map((step, i) => (
                            <li key={step.id} className="flex gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-bold flex items-center justify-center mt-0.5">
                                    {i + 1}
                                </span>
                                <span className="leading-relaxed">
                                    <FormattedMessage id={step.id} defaultMessage={step.defaultMessage} />
                                </span>
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        </div>
    );
}

export default function HelpPage() {
    const sections: FeatureSectionProps[] = [
        {
            icon: <ShoppingBasket size={20} />,
            titleId: "help.shopTitle",
            titleDefault: "Shopping View",
            descId: "help.shopDesc",
            descDefault: "The main screen shows your current week's shopping list. Items are grouped by category so you can navigate the supermarket aisle by aisle. Pending items appear at the top, completed items move to the bottom as a collapsible section.",
            color: "bg-blue-600 dark:bg-blue-700",
        },
        {
            icon: <PlusCircle size={20} />,
            titleId: "help.addItemTitle",
            titleDefault: "Adding Items",
            descId: "help.addItemDesc",
            descDefault: "Use the input field at the top of the shopping view to add items. As you type, the app will suggest items from your history. Press Add or hit Enter to add them to the list instantly.",
            steps: [
                { id: "help.addItemStep1", defaultMessage: "Tap the input field at the top of the screen." },
                { id: "help.addItemStep2", defaultMessage: "Type the item name — suggestions from your history will appear." },
                { id: "help.addItemStep3", defaultMessage: "Press \"Add\" or hit Enter to add it to the list." },
            ],
            color: "bg-emerald-600 dark:bg-emerald-700",
        },
        {
            icon: <CheckCircle size={20} />,
            titleId: "help.completeItemTitle",
            titleDefault: "Completing Items",
            descId: "help.completeItemDesc",
            descDefault: "Tap the circle icon on the left of any item to mark it as collected. Completed items move to the bottom section and become slightly faded. Tap again to uncheck them.",
            color: "bg-green-600 dark:bg-green-700",
        },
        {
            icon: <Edit2 size={20} />,
            titleId: "help.editItemTitle",
            titleDefault: "Editing Items",
            descId: "help.editItemDesc",
            descDefault: "Tap anywhere on an item card (except the checkmark) to open the edit modal. From there you can change the quantity (e.g. \"2\", \"500g\", \"1 pack\") and assign or change its category.",
            color: "bg-violet-600 dark:bg-violet-700",
        },
        {
            icon: <RefreshCw size={20} />,
            titleId: "help.newWeekTitle",
            titleDefault: "Starting a New Week",
            descId: "help.newWeekDesc",
            descDefault: "When you're done shopping and want to start fresh, open the burger menu (☰) in the top-right and tap \"New Week\". This resets all items in the active list so you can plan next week's shop from scratch.",
            color: "bg-orange-500 dark:bg-orange-600",
        },
        {
            icon: <List size={20} />,
            titleId: "help.masterItemsTitle",
            titleDefault: "Master Items (Items Tab)",
            descId: "help.masterItemsDesc",
            descDefault: "The Items tab lets you manage a master catalogue of products. Items you add here appear as autocomplete suggestions when you type in the shopping view. You can also delete items you no longer need from the catalogue.",
            color: "bg-cyan-600 dark:bg-cyan-700",
        },
        {
            icon: <Tags size={20} />,
            titleId: "help.categoriesTitle",
            titleDefault: "Categories",
            descId: "help.categoriesDesc",
            descDefault: "Use the Categories tab to create custom categories (e.g. Bakery, Pharmacy). These categories appear in the item edit modal, allowing you to organise your list by store section. Items without a category are grouped under \"Uncategorized\".",
            color: "bg-pink-600 dark:bg-pink-700",
        },
        {
            icon: <ClipboardList size={20} />,
            titleId: "help.listsTitle",
            titleDefault: "Multiple Shopping Lists",
            descId: "help.listsDesc",
            descDefault: "You can have multiple shopping lists — for example, a weekly grocery list and a separate home supplies list. Switch between them using the list name selector in the top-left of the header. Set a default list with the star (⭐) icon so it loads automatically when you open the app.",
            steps: [
                { id: "help.listsStep1", defaultMessage: "Go to the Lists tab in the bottom navigation." },
                { id: "help.listsStep2", defaultMessage: "Tap \"Create New List\" and enter a name." },
                { id: "help.listsStep3", defaultMessage: "Tap the ⭐ icon next to a list to set it as your default." },
            ],
            color: "bg-indigo-600 dark:bg-indigo-700",
        },
        {
            icon: <Users size={20} />,
            titleId: "help.sharingTitle",
            titleDefault: "Sharing & Collaboration",
            descId: "help.sharingDesc",
            descDefault: "Share a list with family or flatmates so you can all shop together. Each collaborator sees live updates and can add or check off items. Invitations are sent by email and managed from the list settings page.",
            steps: [
                { id: "help.sharingStep1", defaultMessage: "Go to Lists → tap the ⚙ (settings) icon on a list you own." },
                { id: "help.sharingStep2", defaultMessage: "Enter the other person's email and tap \"Invite\"." },
                { id: "help.sharingStep3", defaultMessage: "They will receive a notification and can accept from Settings → Pending Invitations." },
            ],
            color: "bg-teal-600 dark:bg-teal-700",
        },
        {
            icon: <Share2 size={20} />,
            titleId: "help.listSettingsTitle",
            titleDefault: "List Settings",
            descId: "help.listSettingsDesc",
            descDefault: "Each list you own has a settings page where you can rename it, view current members, send new invitations, and remove members who no longer need access.",
            color: "bg-slate-600 dark:bg-slate-700",
        },
        {
            icon: <Bell size={20} />,
            titleId: "help.notificationsTitle",
            titleDefault: "Push Notifications",
            descId: "help.notificationsDesc",
            descDefault: "Enable push notifications in Settings to get an alert whenever someone adds a new item to a shared list. On iPhone, you must first add the app to your Home Screen before notifications can be enabled.",
            color: "bg-amber-500 dark:bg-amber-600",
        },
        {
            icon: <Smartphone size={20} />,
            titleId: "help.pwaTitle",
            titleDefault: "Install as App (PWA)",
            descId: "help.pwaDesc",
            descDefault: "Weekly Shopping List is a Progressive Web App — you can install it on your phone's Home Screen for a native app experience. It also works offline so you can access your list even without an internet connection.",
            steps: [
                { id: "help.pwaStep1iOS", defaultMessage: "iPhone: Tap the Share button in Safari, then \"Add to Home Screen\"." },
                { id: "help.pwaStep2Android", defaultMessage: "Android: Tap the browser menu (⋮) then \"Add to Home Screen\" or \"Install App\"." },
            ],
            color: "bg-gray-700 dark:bg-gray-600",
        },
        {
            icon: <Settings size={20} />,
            titleId: "help.settingsTitle",
            titleDefault: "Settings",
            descId: "help.settingsDesc",
            descDefault: "Accessible from the burger menu or the bottom navigation bar:\n• Account: view your profile and sign out.\n• Language: switch between English, Spanish, and Catalan.\n• Appearance: choose Light, Dark, or System theme.\n• Notifications: enable or disable push alerts.\n• Subscriptions: unsubscribe from lists shared with you.",
            color: "bg-rose-600 dark:bg-rose-700",
        },
        {
            icon: <Star size={20} />,
            titleId: "help.defaultListTitle",
            titleDefault: "Default List",
            descId: "help.defaultListDesc",
            descDefault: "Your default list is the one that loads automatically when you open the app. Set it from the Lists tab by tapping the star (⭐) icon. If you have multiple lists, you can switch between them at any time using the header dropdown.",
            color: "bg-yellow-500 dark:bg-yellow-600",
        },
    ];

    return (
        <PageContainer className="pb-10">
            <header className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
                        <BookOpen size={20} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        <FormattedMessage id="help.pageTitle" defaultMessage="User Guide" />
                    </h1>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    <FormattedMessage
                        id="help.pageSubtitle"
                        defaultMessage="Everything you need to know about Weekly Shopping List."
                    />
                </p>
            </header>

            <div className="space-y-4">
                {sections.map((section) => (
                    <FeatureSection key={section.titleId} {...section} />
                ))}
            </div>

            <footer className="mt-8 text-center text-xs text-gray-400 dark:text-gray-600">
                <FormattedMessage
                    id="help.footer"
                    defaultMessage="Weekly Shopping List — making grocery shopping easier, one week at a time."
                />
            </footer>
        </PageContainer>
    );
}
