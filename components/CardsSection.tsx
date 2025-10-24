"use client";

export default function CardsSection({children}: {children?: React.ReactNode}) {
    return (
        <section className="my-4 grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4" >
            {children}
        </section>
    );
}