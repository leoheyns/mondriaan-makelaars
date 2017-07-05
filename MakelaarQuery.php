<?php include 'auth.php'; ?>
<form action="HuizenVerkochtPeriode.php" method="post">
Aantal verkochte huizen in een periode: <br />
voer de vroegste datum in: <input type="date" name="DateMin"> <br />
voer de laatste datum in: <input type="date" name="DateMax"> <br />
<input type="submit" value="Submit">
</form>
Meest verkochte type huis:
<?php
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT Type FROM panden GROUP BY Type ORDER BY COUNT(*) DESC LIMIT    1",$mysql) or die("De query op de database is mislukt!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");
print(mysql_fetch_row($resultaat)[0]);
?>
<br /><br />

Regio met meeste huizen verkocht:
<?php
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT RegioPand, Verkocht FROM panden WHERE Verkocht = 'Ja' GROUP BY RegioPand ORDER BY COUNT(RegioPand) DESC LIMIT  1",$mysql) or die("De query op de database is mislukt!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");
print(mysql_fetch_row($resultaat)[0]);
?>

<br /><br />

Kopers uit regio: <br />
<?php
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT DISTINCT Regio FROM kopers",$mysql) or die("De query op de database is mislukt1!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");

while($Regio = mysql_fetch_row($resultaat)[0]){
  $mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
  mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
  $resultaat2 = mysql_query("SELECT COUNT(Regio) FROM kopers WHERE Regio = '$Regio'",$mysql) or die("De query op de database is mislukt2!");
  mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");
  print ($Regio . "  " .mysql_fetch_row($resultaat2)[0] . "<br />");
}
?> <br /><br />

Omzet per verkoper: <br />
<?php
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT * FROM verkopers",$mysql) or die("De query op de database is mislukt1!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");
while(list($VerkoperID,$Voornaam,$Tussenvoegsel,$Achternaam,$Telefoonnummer,$EmailVerkoper) = mysql_fetch_row($resultaat)){
  $naam = $Voornaam . " " . $Tussenvoegsel . " " . $Achternaam;
  print($naam);
  $mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
  mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
  $resultaat2 = mysql_query("SELECT SUM(Verkoopprijs), VerkoperID FROM panden WHERE VerkoperID = '$VerkoperID'",$mysql) or die("De query op de database is mislukt1!");
  mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");

  $mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
  mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
  $resultaat3 = mysql_query("SELECT SUM(Inkoopprijs), VerkoperID FROM panden WHERE VerkoperID = '$VerkoperID'",$mysql) or die("De query op de database is mislukt1!");
  mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");


  $Omzet = mysql_fetch_row($resultaat2)[0] - mysql_fetch_row($resultaat3)[0];
  print("  ");
  print($Omzet);
  print("<br />");
}
?> <br /><br />


Gemiddelde inkoopprijs:
<?php
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT AVG(Inkoopprijs) FROM panden",$mysql) or die("De query op de database is mislukt1!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");
print(mysql_fetch_row($resultaat)[0]);
?> <br /><br />


Gemiddelde Verkoopprijs:
<?php
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT AVG(Verkoopprijs) FROM panden",$mysql) or die("De query op de database is mislukt1!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");
print(mysql_fetch_row($resultaat)[0]);
?> <br /><br />

Niet verkochte panden:
<?php
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT COUNT(*) FROM panden WHERE Verkocht = 'Nee'",$mysql) or die("De query op de database is mislukt1!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");
print(mysql_fetch_row($resultaat)[0]);
?> <br /><br />

Beste Maand:
<?php
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT DATE_FORMAT( VerkoopDatum,  '%m' ), VerkoopDatum FROM panden GROUP BY DATE_FORMAT( VerkoopDatum,  '%m' ) ORDER BY COUNT(DATE_FORMAT( VerkoopDatum,  '%m' )) DESC LIMIT  1",$mysql) or die("De query op de database is mislukt!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");
$monthNum  = mysql_fetch_row($resultaat)[0];
$dateObj   = DateTime::createFromFormat('!m', $monthNum);
$monthName = $dateObj->format('F'); // March
print(" ");
print($monthName);
?>
