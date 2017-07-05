<?php
$PandID = NULL;
$PandNaam = $_POST["PandNaam"];
$VerkoperID = $_POST["VerkoperID"];
$VerkoopDatum = $_POST["VerkoopDatum"];
$Inkoopprijs = $_POST["Inkoopprijs"];
$Verkoopprijs = $_POST["Verkoopprijs"];
$Verkocht = $_POST["Verkocht?"];
$RegioPand = $_POST["RegioPand"];
$Type = $_POST["Type"];
$Plaatje = $_POST["Plaatje"];
$Postcode = $_POST["Postcode"];
$Plaats = $_POST["Plaats"];
$OppervlakteGrond = $_POST["OppervlakteGrond"];
$OppervlakteHuis = $_POST["OppervlakteHuis"];
$Slaapkamers = $_POST["Slaapkamers"];
$RichtingTuin = $_POST["RichtingTuin"];
$Beschrijving = $_POST["Beschrijving"];
{
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
mysql_query("INSERT INTO panden VALUES ('$PandID','$PandNaam','$VerkoperID','$VerkoopDatum','$Inkoopprijs','$Verkoopprijs','$Verkocht','$RegioPand','$Type','$Plaatje','$Postcode','$Plaats','$OppervlakteHuis','$OppervlakteGrond','$Slaapkamers','$RichtingTuin','$Beschrijving')",$mysql) or die("De toevoegquery op de database is mislukt!"); 
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");

print("Het huis met het adres $PandNaam is toegevoegd aan de database");
}
?>
