import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
    en: {
        translation: {
            nav: {
                home: "Home",
                menu: "Menu",
                about: "About",
                reservation: "Reservation",
                gallery: "Gallery",
                chef: "Chef",
                location: "Location",
                information: "Information",
            },
            hero: {
                tagline: "Modern European Dining",
                subtitle: "Floor 23 · Hôtel des Arts Saigon",
                cta_reserve: "Reserve a Table",
                cta_menu: "View Menu",
            },
            subnav: {
                brand: "The Albion by Kirk",
                book: "Book a Table",
            },
            about: {
                label: "The Restaurant",
                title: "Where European Heritage Meets Saigon's Vibrancy",
                description:
                    "Perched on the 23rd floor of Hôtel des Arts Saigon, The Albion by Kirk Westaway offers sweeping views of the city skyline and a casually refined take on modern European cuisine, anchored in British heritage.",
                detail:
                    "Chef Kirk Westaway, the two Michelin-starred chef behind JAAN by Kirk Westaway in Singapore, brings his commitment to reimagining British cuisine with precision and clarity of flavour to Ho Chi Minh City.",
                hours_label: "Opening Hours",
                hours: "Everyday · 5:30 pm – 11:30 pm",
                address_label: "Location",
                address: "Floor 23, 76-78 Nguyen Thi Minh Khai, District 3, Ho Chi Minh City",
            },
            menu: {
                label: "The Menu",
                title: "A Curated Culinary Journey",
                subtitle: "Seasonal produce, clean flavours, beautiful simplicity",
                tabs: {
                    dinner: "Dinner",
                    bar: "The Bar",
                    tasting: "Tasting Menu",
                },
                starters: "Starters",
                mains: "Mains",
                desserts: "Desserts",
                signatures: "Signature Dishes",
                coming_soon: "Menu details coming soon",
            },
            chef: {
                label: "Meet the Chef",
                name: "Kirk Westaway",
                title: "Executive Chef & Founder",
                quote:
                    '"The Vietnamese palate is actually more similar to modern British cuisine than you might think."',
                bio: "Known around the world for JAAN by Kirk Westaway in Singapore, where he has maintained two MICHELIN stars for four consecutive years, Chef Kirk brings that same innovative spirit to The Albion — creating rustic, beautifully crafted dishes perfect for sharing.",
                awards: {
                    michelin: "Michelin Selected 2025",
                    tatler_ap: "Tatler Best Asia Pacific 2025",
                    tatler_vn: "Tatler Restaurant of the Year 2025",
                },
            },
            gallery: {
                label: "Gallery",
                title: "A Visual Feast",
            },
            reservation: {
                label: "Reserve",
                title: "Reserve Your Table",
                subtitle: "Join us for an unforgettable evening above the Saigon skyline",
                coming_soon: "Reservation system coming soon",
            },
            footer: {
                address: "Floor 23, Hôtel des Arts Saigon\n76-78 Nguyen Thi Minh Khai, District 3\nHo Chi Minh City, Vietnam",
                hours: "Daily: 5:30 PM – 11:30 PM",
                tel: "Tel: 0901 379 129",
                email: "tuong.cat@accor.com",
                rights: "© 2025 The Albion by Kirk · Hôtel des Arts Saigon",
            },
            live: {
                status_open: "Accepting Reservations",
                status_busy: "Kitchen is Busy",
                tables: "tables available",
                realtime: "Live Status",
            },
            lang: {
                en: "EN",
                vi: "VI",
            },
        },
    },
    vi: {
        translation: {
            nav: {
                home: "Trang Chủ",
                menu: "Thực Đơn",
                about: "Giới Thiệu",
                reservation: "Đặt Bàn",
                gallery: "Thư Viện",
                chef: "Đầu Bếp",
                location: "Địa Điểm",
                information: "Thông Tin",
            },
            hero: {
                tagline: "Ẩm Thực Châu Âu Hiện Đại",
                subtitle: "Tầng 23 · Hôtel des Arts Sài Gòn",
                cta_reserve: "Đặt Bàn Ngay",
                cta_menu: "Xem Thực Đơn",
            },
            subnav: {
                brand: "The Albion by Kirk",
                book: "Đặt Bàn",
            },
            about: {
                label: "Nhà Hàng",
                title: "Nơi Di Sản Châu Âu Gặp Sức Sống Sài Gòn",
                description:
                    "Tọa lạc tại tầng 23 của Hôtel des Arts Sài Gòn, The Albion by Kirk Westaway mang đến tầm nhìn toàn cảnh đường chân trời thành phố cùng phong cách ẩm thực Châu Âu hiện đại tinh tế mà gần gũi.",
                detail:
                    "Bếp trưởng Kirk Westaway, người đã giữ hai sao Michelin tại nhà hàng JAAN ở Singapore, mang triết lý ẩm thực Anh Quốc được tái diễn giải với sự chính xác và tinh tế về hương vị đến Thành phố Hồ Chí Minh.",
                hours_label: "Giờ Mở Cửa",
                hours: "Hàng ngày · 17:30 – 23:30",
                address_label: "Địa Chỉ",
                address: "Tầng 23, 76-78 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP.HCM",
            },
            menu: {
                label: "Thực Đơn",
                title: "Hành Trình Ẩm Thực Được Chắt Lọc",
                subtitle: "Nguyên liệu theo mùa, hương vị tinh khiết, trình bày đẹp mắt",
                tabs: {
                    dinner: "Bữa Tối",
                    bar: "Quầy Bar",
                    tasting: "Thực Đơn Thử",
                },
                starters: "Khai Vị",
                mains: "Món Chính",
                desserts: "Tráng Miệng",
                signatures: "Món Đặc Trưng",
                coming_soon: "Chi tiết thực đơn sắp ra mắt",
            },
            chef: {
                label: "Gặp Gỡ Đầu Bếp",
                name: "Kirk Westaway",
                title: "Bếp Trưởng & Nhà Sáng Lập",
                quote:
                    '"Khẩu vị của người Việt thực ra gần với ẩm thực Anh hiện đại hơn bạn nghĩ."',
                bio: "Nổi tiếng khắp thế giới với JAAN by Kirk Westaway tại Singapore, nơi ông duy trì hai sao Michelin suốt bốn năm liên tiếp, Bếp trưởng Kirk mang tinh thần sáng tạo đó vào The Albion.",
                awards: {
                    michelin: "Michelin Selected 2025",
                    tatler_ap: "Tatler Châu Á Thái Bình Dương 2025",
                    tatler_vn: "Tatler Nhà Hàng Của Năm 2025",
                },
            },
            gallery: {
                label: "Thư Viện Ảnh",
                title: "Bữa Tiệc Thị Giác",
            },
            reservation: {
                label: "Đặt Bàn",
                title: "Đặt Bàn Của Bạn",
                subtitle: "Hãy đến với chúng tôi cho một buổi tối khó quên trên bầu trời Sài Gòn",
                coming_soon: "Hệ thống đặt bàn sắp ra mắt",
            },
            footer: {
                address: "Tầng 23, Hôtel des Arts Sài Gòn\n76-78 Nguyễn Thị Minh Khai, Quận 3\nTP. Hồ Chí Minh, Việt Nam",
                hours: "Hàng ngày: 17:30 – 23:30",
                tel: "Tel: 0901 379 129",
                email: "tuong.cat@accor.com",
                rights: "© 2025 The Albion by Kirk · Hôtel des Arts Sài Gòn",
            },
            live: {
                status_open: "Đang Nhận Đặt Bàn",
                status_busy: "Nhà Hàng Đang Bận",
                tables: "bàn còn trống",
                realtime: "Trạng Thái Trực Tiếp",
            },
            lang: {
                en: "EN",
                vi: "VI",
            },
        },
    },
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: "en",
        fallbackLng: "en",
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
