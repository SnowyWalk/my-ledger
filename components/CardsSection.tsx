"use client";

export default function CardsSection({children}: {children?: React.ReactNode}) {
    return (
        <section className="my-4 columns-1 md:columns-1 lg:columns-2 xl:columns-3 2xl:columns-4 gap-4" >
            {children}
        </section>
    );
}