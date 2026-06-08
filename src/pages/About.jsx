// import { BadgeCheck, Bus, MapPin, Users, Heart, Globe } from "lucide-react";
// import { Link } from "react-router-dom";

// export default function About() {
//   return (
//     <div data-testid="about-page">
//       <section className="relative h-[55vh] overflow-hidden">
//         <img
//           src="https://images.pexels.com/photos/9628139/pexels-photo-9628139.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1600"
//           alt="О компании"
//           className="absolute inset-0 w-full h-full object-cover"
//         />
//         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
//         <div className="relative h-full section-container flex flex-col justify-end pb-12 text-white">
//           <p className="text-white/85">О компании</p>
//           <h1 className="font-heading text-5xl lg:text-7xl mt-2 max-w-3xl">
//             Делаем путешествия простыми
//           </h1>
//         </div>
//       </section>

//       <section className="section-container py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-start">
//         <div className="space-y-5 text-neutral-700 leading-relaxed text-lg">
//           <p>
//             TRAVELSPACE — туроператор автобусных туров из Минска. Мы сами
//             разрабатываем маршруты, сами их проходим и сами сопровождаем группы
//             в дороге. Никаких посредников между вами и поездкой.
//           </p>
//           <p>
//             Мы убеждены: хороший тур — это не про десятки экскурсий в день, а
//             про спокойное знакомство с местом, заботливого гида и понятную
//             программу без сюрпризов.
//           </p>
//           <p>
//             За плечами — сотни выездов, тысячи довольных туристов и проверенные
//             партнёрские отели на каждом направлении.
//           </p>
//         </div>

//         <div className="grid sm:grid-cols-2 gap-4">
//           {[
//             { icon: BadgeCheck, n: "8+", t: "лет на рынке" },
//             { icon: Users, n: "5 000+", t: "туристов в год" },
//             { icon: Bus, n: "12", t: "комфортабельных автобусов" },
//             { icon: Globe, n: "4", t: "ключевых направления" },
//           ].map((s) => (
//             <div
//               key={s.t}
//               className="rounded-2xl border border-neutral-200 p-6 bg-white"
//             >
//               <s.icon className="size-5 text-[#C2410C]" />
//               <p className="font-heading text-4xl font-bold mt-3">{s.n}</p>
//               <p className="text-sm text-neutral-600 mt-1">{s.t}</p>
//             </div>
//           ))}
//         </div>
//       </section>

//       <section className="bg-neutral-50 section-pad">
//         <div className="section-container">
//           <p className="overline text-[#C2410C]">Принципы</p>
//           <h2 className="font-heading text-3xl sm:text-4xl mt-2 mb-10 max-w-2xl">
//             Во что мы верим
//           </h2>
//           <div className="grid md:grid-cols-3 gap-6">
//             {[
//               {
//                 i: Heart,
//                 t: "Забота важнее галочек",
//                 d: "Лучше пройти меньше точек, чем устать и не запомнить ни одной.",
//               },
//               {
//                 i: MapPin,
//                 t: "Сначала идём сами",
//                 d: "Все маршруты протестированы лично — мы знаем все тонкости.",
//               },
//               {
//                 i: BadgeCheck,
//                 t: "Прозрачные цены",
//                 d: "Никаких скрытых платежей. То, что в стоимости — есть в стоимости.",
//               },
//             ].map((b) => (
//               <div
//                 key={b.t}
//                 className="rounded-2xl bg-white border border-neutral-200 p-6"
//               >
//                 <span className="size-10 rounded-xl bg-orange-50 grid place-items-center text-[#C2410C]">
//                   <b.i className="size-5" />
//                 </span>
//                 <h3 className="font-heading text-xl mt-4">{b.t}</h3>
//                 <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
//                   {b.d}
//                 </p>
//               </div>
//             ))}
//           </div>

//           <div className="mt-16 flex flex-wrap gap-3">
//             <Link
//               to="/tours"
//               className="rounded-full bg-[#C2410C] hover:bg-[#9A3412] text-white px-6 py-3 text-sm font-medium"
//             >
//               Все туры
//             </Link>
//             <Link
//               to="/contacts"
//               className="rounded-full border border-neutral-300 hover:border-neutral-500 px-6 py-3 text-sm font-medium"
//             >
//               Контакты
//             </Link>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }
import { BadgeCheck, Bus, MapPin, Users, Heart, Globe } from "lucide-react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div data-testid="about-page">
      <section className="relative h-[55vh] overflow-hidden">
        <img
          src="https://images.pexels.com/photos/9628139/pexels-photo-9628139.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1600"
          alt="О компании"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="relative h-full section-container flex flex-col justify-end pb-12 text-white">
          <p className="text-white/85">О компании</p>
          <h1 className="font-heading text-5xl lg:text-7xl mt-2 max-w-3xl">
            Делаем путешествия простыми
          </h1>
        </div>
      </section>

      <section className="section-container py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-5 text-neutral-700 leading-relaxed text-lg">
          <p>
            TRAVELSPACE — туроператор автобусных туров из Минска. Мы сами
            разрабатываем маршруты, сами их проходим и сами сопровождаем группы
            в дороге. Никаких посредников между вами и поездкой.
          </p>
          <p>
            Мы убеждены: хороший тур — это не про десятки экскурсий в день, а
            про спокойное знакомство с местом, заботливого гида и понятную
            программу без сюрпризов.
          </p>
          <p>
            За плечами — сотни выездов, тысячи довольных туристов и проверенные
            партнёрские отели на каждом направлении.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: BadgeCheck, n: "8+", t: "лет на рынке" },
            { icon: Users, n: "5 000+", t: "туристов в год" },
            { icon: Bus, n: "12", t: "комфортабельных автобусов" },
            { icon: Globe, n: "4", t: "ключевых направления" },
          ].map((s) => (
            <div
              key={s.t}
              className="rounded-2xl border border-neutral-200 p-6 bg-white"
            >
              <s.icon className="size-5 text-[#C2410C]" />
              <p className="font-heading text-4xl font-bold mt-3">{s.n}</p>
              <p className="text-sm text-neutral-600 mt-1">{s.t}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-neutral-50 section-pad">
        <div className="section-container">
          <p className="overline text-[#C2410C]">Принципы</p>
          <h2 className="font-heading text-3xl sm:text-4xl mt-2 mb-10 max-w-2xl">
            Во что мы верим
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                i: Heart,
                t: "Забота важнее галочек",
                d: "Лучше пройти меньше точек, чем устать и не запомнить ни одной.",
              },
              {
                i: MapPin,
                t: "Сначала идём сами",
                d: "Все маршруты протестированы лично — мы знаем все тонкости.",
              },
              {
                i: BadgeCheck,
                t: "Прозрачные цены",
                d: "Никаких скрытых платежей. То, что в стоимости — есть в стоимости.",
              },
            ].map((b) => (
              <div
                key={b.t}
                className="rounded-2xl bg-white border border-neutral-200 p-6"
              >
                <span className="size-10 rounded-xl bg-orange-50 grid place-items-center text-[#C2410C]">
                  <b.i className="size-5" />
                </span>
                <h3 className="font-heading text-xl mt-4">{b.t}</h3>
                <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                  {b.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
