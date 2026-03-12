-- CreateTable
CREATE TABLE "MenuSpecialRequest" (
    "menuId" INTEGER NOT NULL,
    "specialRequestId" INTEGER NOT NULL,

    CONSTRAINT "MenuSpecialRequest_pkey" PRIMARY KEY ("menuId","specialRequestId")
);

-- AddForeignKey
ALTER TABLE "MenuSpecialRequest" ADD CONSTRAINT "MenuSpecialRequest_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuSpecialRequest" ADD CONSTRAINT "MenuSpecialRequest_specialRequestId_fkey" FOREIGN KEY ("specialRequestId") REFERENCES "SpecialRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
