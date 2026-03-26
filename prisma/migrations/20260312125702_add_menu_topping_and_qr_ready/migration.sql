-- CreateTable
CREATE TABLE "MenuTopping" (
    "menuId" INTEGER NOT NULL,
    "toppingId" INTEGER NOT NULL,

    CONSTRAINT "MenuTopping_pkey" PRIMARY KEY ("menuId","toppingId")
);

-- AddForeignKey
ALTER TABLE "MenuTopping" ADD CONSTRAINT "MenuTopping_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuTopping" ADD CONSTRAINT "MenuTopping_toppingId_fkey" FOREIGN KEY ("toppingId") REFERENCES "Topping"("id") ON DELETE CASCADE ON UPDATE CASCADE;
